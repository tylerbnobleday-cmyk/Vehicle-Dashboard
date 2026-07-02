#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <SoftwareSerial.h>
#include <TinyGPSPlus.h>

// Subaru Forester ESP8266 WiFi speedometer.
// Display is TL-3 style 8 digit 7-segment using 2x 74HC595D shift registers.

#define PROFILE 8

const char* AP_SSID = "ForesterDash";
const char* AP_PASSWORD = "Forester123";

const uint8_t DISPLAY_DIO = D8; // GPIO15
const uint8_t DISPLAY_SCK = D7; // GPIO13
const uint8_t DISPLAY_RCK = D6; // GPIO12

const uint8_t GPS_RX_PIN = D4; // ESP receives from GPS TX, GPIO2
const uint8_t GPS_TX_PIN = D5; // ESP transmits to GPS RX, GPIO14

const uint32_t USB_BAUD = 115200;
const uint32_t GPS_BAUD = 9600;
const uint16_t DASH_PUSH_MS = 1000;
const unsigned int DIGIT_DELAY_US = 1200;
const float PARKED_IGNORE_KMH = 3.0;
const float MAX_REASONABLE_JUMP_KM = 0.2;
const uint32_t LIMIT_STALE_MS = 15000;

ESP8266WebServer server(80);
SoftwareSerial gpsSerial(GPS_RX_PIN, GPS_TX_PIN);
TinyGPSPlus gps;

bool displayEnabled = true;
int displaySpeedKmh = 0;

float smoothedSpeedKmh = 0.0;
float rawSpeedKmh = 0.0;
float tripKm = 0.0;
float lastOdoAddKm = 0.0;
float lastLat = 0.0;
float lastLon = 0.0;
bool haveLastLocation = false;

int speedLimitKmh = 60;
int speedMarginKmh = 3;
int smoothingPercent = 25;
bool autoZone = true;
uint32_t lastLimitUpdateMs = 0;
uint32_t lastDashPushMs = 0;
uint32_t lastFlashMs = 0;
bool flashVisible = true;

// Standard 7-seg map: bit0=A, bit1=B, bit2=C, bit3=D, bit4=E, bit5=F, bit6=G, bit7=DP.
// PROFILE 8 uses the working scanner profile: normal segment map with inverted segment bits.
const byte SEG_NORMAL[10] = {
  0b00111111, // 0
  0b00000110, // 1
  0b01011011, // 2
  0b01001111, // 3
  0b01100110, // 4
  0b01101101, // 5
  0b01111101, // 6
  0b00000111, // 7
  0b01111111, // 8
  0b01101111  // 9
};

byte remapSegments(byte seg, int mapId) {
  const byte maps[8][8] = {
    {0, 1, 2, 3, 4, 5, 6, 7},
    {7, 6, 5, 4, 3, 2, 1, 0},
    {1, 2, 3, 4, 5, 6, 0, 7},
    {6, 5, 4, 3, 2, 1, 0, 7},
    {0, 5, 4, 3, 2, 1, 6, 7},
    {5, 0, 1, 2, 3, 4, 6, 7},
    {2, 1, 0, 5, 4, 3, 6, 7},
    {3, 2, 1, 0, 5, 4, 6, 7}
  };

  mapId &= 7;
  byte out = 0;
  for (int i = 0; i < 8; i++) {
    if (seg & (1 << i)) out |= (1 << maps[mapId][i]);
  }
  return out;
}

byte getSeg(byte number) {
  int segMap = PROFILE & 7;
  bool invertSegs = PROFILE & 8;
  byte seg = remapSegments(SEG_NORMAL[number], segMap);
  return invertSegs ? ~seg : seg;
}

byte getDigitMask(int pos) {
  bool reverseDigits = PROFILE & 16;
  bool invertDigits = PROFILE & 32;
  int p = reverseDigits ? (7 - pos) : pos;
  byte digit = (1 << p);
  return invertDigits ? ~digit : digit;
}

void sendBytes(byte b1, byte b2) {
  bool lsbFirst = PROFILE & 128;

  digitalWrite(DISPLAY_RCK, LOW);
  if (lsbFirst) {
    shiftOut(DISPLAY_DIO, DISPLAY_SCK, LSBFIRST, b1);
    shiftOut(DISPLAY_DIO, DISPLAY_SCK, LSBFIRST, b2);
  } else {
    shiftOut(DISPLAY_DIO, DISPLAY_SCK, MSBFIRST, b1);
    shiftOut(DISPLAY_DIO, DISPLAY_SCK, MSBFIRST, b2);
  }
  digitalWrite(DISPLAY_RCK, HIGH);
}

void clearDisplay() {
  sendBytes(0x00, 0x00);
}

void showOneDigit(int pos, int value) {
  bool swapBytes = PROFILE & 64;
  byte seg = getSeg(value);
  byte digit = getDigitMask(pos);
  if (swapBytes) {
    sendBytes(seg, digit);
  } else {
    sendBytes(digit, seg);
  }
}

void showNumberNoLeadingZeros(int number) {
  number = constrain(number, 0, 999);

  int hundreds = (number / 100) % 10;
  int tens = (number / 10) % 10;
  int ones = number % 10;

  if (number == 0) {
    showOneDigit(7, 0);
    delayMicroseconds(DIGIT_DELAY_US);
    return;
  }

  if (number >= 100) {
    showOneDigit(5, hundreds);
    delayMicroseconds(DIGIT_DELAY_US);
  }
  if (number >= 10) {
    showOneDigit(6, tens);
    delayMicroseconds(DIGIT_DELAY_US);
  }
  showOneDigit(7, ones);
  delayMicroseconds(DIGIT_DELAY_US);
}

void showAll8() {
  for (int i = 0; i < 8; i++) {
    showOneDigit(i, 8);
    delayMicroseconds(DIGIT_DELAY_US);
  }
}

void refreshDisplay() {
  if (!displayEnabled || !flashVisible) {
    clearDisplay();
    return;
  }

  if (millis() < 3000) {
    showAll8();
  } else {
    showNumberNoLeadingZeros(displaySpeedKmh);
  }
}

float distanceKm(float lat1, float lon1, float lat2, float lon2) {
  const float earthKm = 6371.0;
  float dLat = radians(lat2 - lat1);
  float dLon = radians(lon2 - lon1);
  float a =
    sin(dLat / 2) * sin(dLat / 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    sin(dLon / 2) * sin(dLon / 2);
  return earthKm * 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
}

String boolText(bool value) {
  return value ? "true" : "false";
}

String dashJson() {
  bool fix = gps.location.isValid() && gps.location.age() < 5000;
  bool overLimit = smoothedSpeedKmh > (speedLimitKmh + speedMarginKmh);
  bool staleLimit = millis() - lastLimitUpdateMs > LIMIT_STALE_MS;

  String json = "{";
  json += "\"type\":\"dash\"";
  json += ",\"speedKmh\":" + String((int)round(smoothedSpeedKmh));
  json += ",\"rawSpeedKmh\":" + String((int)round(rawSpeedKmh));
  json += ",\"latitude\":" + (fix ? String(gps.location.lat(), 6) : "null");
  json += ",\"longitude\":" + (fix ? String(gps.location.lng(), 6) : "null");
  json += ",\"satellites\":" + String(gps.satellites.isValid() ? gps.satellites.value() : 0);
  json += ",\"fix\":" + boolText(fix);
  json += ",\"speedLimitKmh\":" + String(speedLimitKmh);
  json += ",\"overLimit\":" + boolText(overLimit);
  json += ",\"tripKm\":" + String(tripKm, 3);
  json += ",\"odometerAddKm\":" + String(lastOdoAddKm, 3);
  json += ",\"headingDeg\":" + (gps.course.isValid() ? String(gps.course.deg(), 0) : "null");
  json += ",\"staleLimit\":" + boolText(staleLimit);
  json += "}";
  return json;
}

void sendDash() {
  String json = dashJson();
  Serial.println(json);
  lastOdoAddKm = 0.0;
}

int extractIntValue(const String& message, int fallback) {
  int valueIndex = message.indexOf("\"value\"");
  if (valueIndex < 0) return fallback;
  int colon = message.indexOf(':', valueIndex);
  if (colon < 0) return fallback;
  return message.substring(colon + 1).toInt();
}

void handleCommand(const String& message) {
  if (message.indexOf("\"LIMIT\"") >= 0 || message.startsWith("LIMIT=")) {
    int value = message.startsWith("LIMIT=") ? message.substring(6).toInt() : extractIntValue(message, speedLimitKmh);
    if (value >= 10 && value <= 130) {
      speedLimitKmh = value;
      lastLimitUpdateMs = millis();
    }
  } else if (message.indexOf("\"MARGIN\"") >= 0 || message.startsWith("MARGIN=")) {
    speedMarginKmh = constrain(message.startsWith("MARGIN=") ? message.substring(7).toInt() : extractIntValue(message, speedMarginKmh), 0, 20);
  } else if (message.indexOf("\"SMOOTH\"") >= 0 || message.startsWith("SMOOTH=")) {
    smoothingPercent = constrain(message.startsWith("SMOOTH=") ? message.substring(7).toInt() : extractIntValue(message, smoothingPercent), 1, 100);
  } else if (message.indexOf("\"RESETTRIP\"") >= 0 || message == "RESETTRIP") {
    tripKm = 0.0;
    lastOdoAddKm = 0.0;
    haveLastLocation = false;
  } else if (message.indexOf("\"STATUS\"") >= 0 || message == "STATUS") {
    sendDash();
  }
}

void updateGpsState() {
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }

  if (gps.speed.isUpdated()) {
    rawSpeedKmh = gps.speed.kmph();
    float alpha = smoothingPercent / 100.0;
    smoothedSpeedKmh = (smoothedSpeedKmh * (1.0 - alpha)) + (rawSpeedKmh * alpha);
    displaySpeedKmh = constrain((int)round(smoothedSpeedKmh), 0, 999);
  }

  if (gps.location.isUpdated() && gps.location.isValid()) {
    float lat = gps.location.lat();
    float lon = gps.location.lng();

    if (haveLastLocation) {
      float movedKm = distanceKm(lastLat, lastLon, lat, lon);
      bool moving = rawSpeedKmh >= PARKED_IGNORE_KMH;
      bool plausible = movedKm > 0.001 && movedKm <= MAX_REASONABLE_JUMP_KM;
      if (moving && plausible) {
        tripKm += movedKm;
        lastOdoAddKm += movedKm;
      }
    }

    lastLat = lat;
    lastLon = lon;
    haveLastLocation = true;
  }
}

void updateSpeedWarning() {
  bool overLimit = smoothedSpeedKmh > (speedLimitKmh + speedMarginKmh);
  if (!overLimit) {
    flashVisible = true;
    return;
  }

  if (millis() - lastFlashMs >= 250) {
    lastFlashMs = millis();
    flashVisible = !flashVisible;
  }
}

void handleRoot() {
  server.send(200, "text/html",
    "<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'>"
    "<title>Forester Dash</title><style>body{font-family:sans-serif;background:#101418;color:#f5f5f5;padding:20px}"
    "button{font-size:18px;margin:4px;padding:10px 14px}</style></head><body>"
    "<h1>Forester WiFi Dash</h1><pre id='out'>Connecting...</pre>"
    "<button onclick='cmd(\"LIMIT\",40)'>40</button><button onclick='cmd(\"LIMIT\",50)'>50</button>"
    "<button onclick='cmd(\"LIMIT\",60)'>60</button><button onclick='cmd(\"LIMIT\",80)'>80</button>"
    "<button onclick='cmd(\"LIMIT\",100)'>100</button><button onclick='cmd(\"RESETTRIP\")'>Reset Trip</button>"
    "<script>async function poll(){let r=await fetch('/api/dash');out.textContent=JSON.stringify(await r.json(),null,2)}"
    "setInterval(poll,1000);poll();"
    "function cmd(c,v){fetch('/api/command?command='+c+(v?'&value='+v:''),{method:'POST'}).then(poll)}</script></body></html>"
  );
}

void addCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void handleDashApi() {
  addCorsHeaders();
  server.send(200, "application/json", dashJson());
}

void handleCommandApi() {
  addCorsHeaders();
  if (server.method() == HTTP_OPTIONS) {
    server.send(204);
    return;
  }

  String command = server.arg("command");
  String value = server.arg("value");

  if (command == "LIMIT") {
    handleCommand("LIMIT=" + value);
  } else if (command == "MARGIN") {
    handleCommand("MARGIN=" + value);
  } else if (command == "SMOOTH") {
    handleCommand("SMOOTH=" + value);
  } else if (command == "RESETTRIP" || command == "STATUS") {
    handleCommand(command);
  }

  server.send(200, "application/json", dashJson());
}

void setup() {
  Serial.begin(USB_BAUD);
  gpsSerial.begin(GPS_BAUD);

  pinMode(DISPLAY_DIO, OUTPUT);
  pinMode(DISPLAY_SCK, OUTPUT);
  pinMode(DISPLAY_RCK, OUTPUT);
  clearDisplay();
  displaySpeedKmh = 0;

  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASSWORD);

  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/dash", HTTP_GET, handleDashApi);
  server.on("/api/command", HTTP_POST, handleCommandApi);
  server.on("/api/command", HTTP_OPTIONS, handleCommandApi);
  server.begin();

  lastLimitUpdateMs = millis();
  Serial.println();
  Serial.println("Forester WiFi Speedometer ready");
  Serial.print("AP IP: ");
  Serial.println(WiFi.softAPIP());
}

void loop() {
  updateGpsState();
  updateSpeedWarning();
  refreshDisplay();
  server.handleClient();

  if (millis() - lastDashPushMs >= DASH_PUSH_MS) {
    lastDashPushMs = millis();
    sendDash();
  }
}
