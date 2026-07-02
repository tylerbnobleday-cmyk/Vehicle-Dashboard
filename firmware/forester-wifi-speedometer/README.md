# Forester WiFi Speedometer Firmware

ESP8266/NodeMCU firmware for the 2010 Subaru Forester dashboard project. The ESP creates its own WiFi network, reads GPS, drives the physical 8-digit 7-segment display, and streams GPS/speed/trip data to the React dashboard over WebSocket.

## Hardware

Board: ESP8266 / NodeMCU

Display: TL-3 style 8-digit 7-segment display using 2x 74HC595D shift registers. This is not MAX7219 and not TM1637.

Display wiring:

| Display | NodeMCU | GPIO |
| --- | --- | --- |
| VCC | 3V3 or 5V depending on module | - |
| GND | GND | - |
| DIO | D8 | GPIO15 |
| SCK | D7 | GPIO13 |
| RCK | D6 | GPIO12 |

GPS wiring:

| GPS | NodeMCU | GPIO |
| --- | --- | --- |
| TX | D4 | GPIO2 |
| RX | D5 | GPIO14 |
| VCC | GPS module rated supply | - |
| GND | GND | - |

## Arduino Setup

Install these libraries in Arduino IDE:

- TinyGPSPlus
- SoftwareSerial
- ESPAsyncTCP
- ESPAsyncWebServer

Board settings:

- Board: NodeMCU 1.0 / ESP-12E Module
- Upload baud: 115200
- Serial monitor baud: 115200

Open and upload:

```text
firmware/forester-wifi-speedometer/Forester_WiFi_Speedometer.ino
```

## WiFi

The ESP creates an access point:

```text
SSID: ForesterDash
Password: Forester123
ESP IP: 192.168.4.1
WebSocket: ws://192.168.4.1/ws
Fallback ESP page: http://192.168.4.1
```

Connect the Samsung tablet to `ForesterDash`, then use the Vehicle Dashboard ESP WiFi Dash card.

## Dashboard Telemetry

The ESP sends JSON every 1 second:

```json
{
  "type": "dash",
  "speedKmh": 63,
  "rawSpeedKmh": 64,
  "latitude": -37.123456,
  "longitude": 145.123456,
  "satellites": 10,
  "fix": true,
  "speedLimitKmh": 60,
  "overLimit": true,
  "tripKm": 2.438,
  "odometerAddKm": 0.012,
  "headingDeg": 270,
  "staleLimit": false
}
```

When connected, the React website uses ESP GPS for the Vehicle page GPS estimate and location. Tablet GPS stays as fallback if ESP is disconnected.

## Dashboard Commands

The website sends commands back over WebSocket:

```json
{ "type": "command", "command": "LIMIT", "value": 60 }
```

Supported commands:

- `LIMIT` with value `40`, `50`, `60`, `80`, or `100`
- `MARGIN` with value such as `3`
- `SMOOTH` with value such as `25`
- `RESETTRIP`
- `STATUS`

## Behaviour

- Physical display shows smoothed GPS speed in km/h.
- Display flashes if `speedKmh > speedLimitKmh + margin`.
- Default speed limit is 60 km/h.
- Speed limit is marked stale after 15 seconds without a new dashboard update.
- Trip kilometres are calculated from GPS.
- GPS drift under about 3 km/h is ignored.
- Impossible GPS jumps are ignored.

## Known Limitations

- GPS does not know road speed limits by itself. The tablet/dashboard must send `LIMIT` updates.
- GitHub Pages is HTTPS and may block `ws://192.168.4.1/ws` as mixed content. If blocked, use local HTTP dev mode or the ESP-hosted page at `http://192.168.4.1`.
- WebSocket access to a local ESP is best on Android Chrome/Samsung Internet. iPhone/Safari is not the target for this setup.
- ESP8266 SoftwareSerial can be fragile. Keep wiring short, stable, and powered properly.
- This physical GPS speedometer is an assist/display. It does not replace the factory speedometer.
