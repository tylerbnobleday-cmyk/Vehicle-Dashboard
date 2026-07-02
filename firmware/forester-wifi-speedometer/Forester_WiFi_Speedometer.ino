#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
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
const float PARKED_IGNORE_KMH = 3.0;
const float MAX_REASONABLE_JUMP_KM = 0.2;
const uint32_t LIMIT_STALE_MS = 15000;

AsyncWebServer server(80);
AsyncWebSocket webSocket("/ws");
SoftwareSerial gpsSerial(GPS_RX_PIN, GPS_TX_PIN);
TinyGPSPlus gps;

uint8_t activeDigit = 0;
uint8_t displayBuffer[8] = {0};
bool displayEnabled = true;

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

// PROFILE 8: segment byte is active high, digit select byte is active high.
// Bits are DP,G,F,E,D,C,B,A for the segment byte.
const uint8_t SEGMENTS[10] = {
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

const uint8_t DIGITS[8] = {
  0b00000001,
  0b00000010,
  0b00000100,
  0b00001000,
  0b00010000,
  0b00100000,
  0b01000000,
  0b10000000
};

void shiftDisplay(uint8_t segments, uint8_t digit) {
  digitalWrite(DISPLAY_RCK, LOW);
  shiftOut(DISPLAY_DIO, DISPLAY_SCK, MSBFIRST, digit);
  shiftOut(DISPLAY_DIO, DISPLAY_SCK, MSBFIRST, segments);
  digitalWrite(DISPLAY_RCK, HIGH);
}

void clearDisplay() {
  shiftDisplay(0, 0);
}

void setDisplaySpeed(int speed) {
  for (uint8_t i = 0; i < 8; i++) displayBuffer[i] = 0;

  speed = constrain(speed, 0, 999);
  if (speed == 0) {
    displayBuffer[7] = SEGMENTS[0];
    return;
  }

  uint8_t position = 7;
  while (speed > 0 && position < 8) {
    displayBuffer[position] = SEGMENTS[speed % 10];
    speed /= 10;
    if (position == 0) break;
    position--;
  }
}

void refreshDisplay() {
  if (!displayEnabled || !flashVisible) {
    clearDisplay();
    return;
  }

  shiftDisplay(displayBuffer[activeDigit], DIGITS[activeDigit]);
  activeDigit = (activeDigit + 1) % 8;
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
  webSocket.textAll(json);
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

void onWebSocketEvent(AsyncWebSocket* server, AsyncWebSocketClient* client, AwsEventType type, void* arg, uint8_t* payload, size_t length) {
  if (type == WS_EVT_DATA) {
    AwsFrameInfo* info = (AwsFrameInfo*)arg;
    if (!info->final || info->index != 0 || info->len != length || info->opcode != WS_TEXT) return;

    String message;
    for (size_t i = 0; i < length; i++) message += (char)payload[i];
    handleCommand(message);
  }

  if (type == WS_EVT_CONNECT) {
    client->text(dashJson());
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
    setDisplaySpeed((int)round(smoothedSpeedKmh));
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
  server.on("/", HTTP_GET, [](AsyncWebServerRequest* request) {
    request->send(200, "text/html",
    "<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'>"
    "<title>Forester Dash</title><style>body{font-family:sans-serif;background:#101418;color:#f5f5f5;padding:20px}"
    "button{font-size:18px;margin:4px;padding:10px 14px}</style></head><body>"
    "<h1>Forester WiFi Dash</h1><pre id='out'>Connecting...</pre>"
    "<button onclick='cmd(\"LIMIT\",40)'>40</button><button onclick='cmd(\"LIMIT\",50)'>50</button>"
    "<button onclick='cmd(\"LIMIT\",60)'>60</button><button onclick='cmd(\"LIMIT\",80)'>80</button>"
    "<button onclick='cmd(\"LIMIT\",100)'>100</button><button onclick='cmd(\"RESETTRIP\")'>Reset Trip</button>"
    "<script>let ws=new WebSocket('ws://'+location.hostname+'/ws');"
    "ws.onmessage=e=>out.textContent=JSON.stringify(JSON.parse(e.data),null,2);"
    "function cmd(c,v){ws.send(JSON.stringify({type:'command',command:c,value:v}))}</script></body></html>"
    );
  });
}

void setup() {
  Serial.begin(USB_BAUD);
  gpsSerial.begin(GPS_BAUD);

  pinMode(DISPLAY_DIO, OUTPUT);
  pinMode(DISPLAY_SCK, OUTPUT);
  pinMode(DISPLAY_RCK, OUTPUT);
  clearDisplay();
  setDisplaySpeed(0);

  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASSWORD);

  handleRoot();
  webSocket.onEvent(onWebSocketEvent);
  server.addHandler(&webSocket);
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
  webSocket.cleanupClients();

  if (millis() - lastDashPushMs >= DASH_PUSH_MS) {
    lastDashPushMs = millis();
    sendDash();
  }
}
