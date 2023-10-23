#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <EncButton.h>
#include <FileData.h>
#include <LittleFS.h>
#include <SimplePortal.h>
#include <WebSocketsServer.h>
#include <Wire.h>
#include <rgb_lcd.h>

#include "TCS3472.hpp"
#include "config.h"
#include "led.hpp"
#include "tmr.hpp"

// --- Global variables ---
rgb_lcd          lcd;                          // For LCD
WiFiSettings     wifi_settings;                // For Wi-Fi
Button           btn(TRIG_PIN);                // For button handling
Led              led(LED_PIN);                 // For LED controlling
TCS3472          rgb;                          // For RGB Sensor reading
WebSocketsServer ws(WS_PORT, "", WS_PROTOCOL); // For WebSocket
uint8_t          client_number = 0;

// For Storing Wi-Fi Settings
FileData wifi_storage(&LittleFS,
                      "/wifi.dat",
                      'B',
                      &wifi_settings,
                      sizeof(wifi_settings));

void setup() {
    // Setup Serial
    {
        Serial.begin(BAUD_RATE);
        Serial.println();
        Serial.println();
        Serial.println("### Firmware Initializing ###");
    }

    // Setup LED
    {
        Serial.println();
        Serial.println("Initializing LCD");
        lcd.begin(LCD_COLS, LCD_ROWS);
        lcd.setRGB(0xff, 0xff, 0xff);
        Serial.println("LCD Initialized!");
    }

    // Setup LittleFS
    {
        Serial.println();
        Serial.println("Initializing LittleFS");
        LittleFS.begin();
        Serial.println("LittleFS Initialized!");
    }

    // Setup FileData
    {
        Serial.println();
        Serial.println("Initializing FileData");
        FDstat_t stat = wifi_storage.read();

        switch (stat) {
            case FD_FS_ERR:
                Serial.println("FS Error");
                while (1) {
                }
                break;
            case FD_FILE_ERR:
                Serial.println("File Error");
                while (1) {
                }
                break;
#ifdef DEBUG
            case FD_WRITE:
                Serial.println("Data Write");
                break;
            case FD_ADD:
                Serial.println("Data Add");
                break;
            case FD_READ:
                Serial.println("Data Read");
                break;
#endif
            default:
                break;
        }
#ifdef DEBUG
        Serial.println("Data read:");
        Serial.println(wifi_settings.ssid);
        Serial.println(wifi_settings.pass);
        Serial.println(wifi_settings.mode == 1   ? "WIFI_STA"
                       : wifi_settings.mode == 2 ? "WIFI_AP"
                                                 : "UNK");
#endif
        Serial.println("FileData Initialized!");
    }

    // Setup Wi-Fi
    {
        Serial.println();
        Serial.println("Initializing Wi-Fi");
        btn.tick();
        if (wifi_settings.ssid[0] != '\0' && btn.read()) {
            // There is a saved Wi-Fi configuration
            Serial.print("Connecting to saved Wi-Fi: ");
            Serial.print(wifi_settings.ssid);

            lcd.setCursor(0, 0);
            lcd.print("Connecting...");
            lcd.setCursor(0, 1);
            lcd.print("To Wi-Fi");
            lcd.setCursor(0, 0);

            WiFi.begin(wifi_settings.ssid, wifi_settings.pass);
            uint32_t tmr = millis();
            while (WiFi.status() != WL_CONNECTED) {
                Serial.print(".");
                delay(200);
                if (millis() - tmr > WIFI_CONNECT_TIMEOUT) {
                    // Timeout is 20s
                    Serial.println();
                    Serial.println("Failed to connect to saved Wi-Fi");
                    Serial.println("Falling back to Wi-Fi Portal");
                    break;
                }
            }
            if (WiFi.status() == WL_CONNECTED) {
                Serial.println();
                Serial.println("Wi-Fi Connected!");
                Serial.print("IP Address: ");
                Serial.println(WiFi.localIP());

                lcd.clear();
                lcd.setCursor(0, 0);
                lcd.print("Waiting for App");
                lcd.setCursor(0, 1);
                lcd.print(WiFi.localIP());
                lcd.setCursor(0, 0);
            }
        }

        btn.tick();
        if (WiFi.status() != WL_CONNECTED || !btn.read()) {
            // There is no saved Wi-Fi configuration or the saved Wi-Fi
            // configuration is invalid
            Serial.println(
                "No saved Wi-Fi configuration or the saved Wi-Fi configuration is invalid");
            Serial.println("Starting Wi-Fi Portal");
            portalStart();
            Serial.println("Wi-Fi Portal Started!");
            Serial.println("SSID: " SP_AP_NAME);
            Serial.println("Portal log:");

            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("SSID: " SP_AP_NAME);
            lcd.setCursor(0, 1);
            lcd.print(WiFi.softAPIP());
            lcd.setCursor(0, 0);

            while (1) {
                if (portalTick()) {
                    Serial.println(portalStatus());
                    if (portalStatus() == SP_SUBMIT) {
                        strncpy(wifi_settings.ssid, portalCfg.SSID, 0x20);
                        strncpy(wifi_settings.pass, portalCfg.pass, 0x20);
                        wifi_settings.mode = portalCfg.mode;

                        Serial.println("Saving Wi-Fi configuration");
                        wifi_storage.updateNow();

                        Serial.println("Wi-Fi configuration saved!");
                        Serial.println("Restarting...");
                        ESP.restart();
                    }
                }
            }
        }
        Serial.println("Wi-Fi Initialized!");
    }

    // Setup WebSocket
    {
        Serial.println();
        Serial.println("Initializing WebSocket");
        ws.begin();
        ws.onEvent([](uint8_t  num,
                      WStype_t type,
                      uint8_t *payload,
                      size_t   length) {
            switch (type) {
                case WStype_DISCONNECTED: {
                    Serial.printf("[%u] Disconnected!\n", num);
                } break;
                case WStype_CONNECTED: {
                    client_number = num;
                    led.on();
                    // lcd.clear();
                    IPAddress ip = ws.remoteIP(num);
                    Serial.printf("[%u] Connected from %d.%d.%d.%d url: %s\n",
                                  num,
                                  ip[0],
                                  ip[1],
                                  ip[2],
                                  ip[3],
                                  payload);
                    // Report board configuration to the app
                    String s;
                    s += "LCD:";
                    s += LCD_COLS;
                    s += ',';
                    s += LCD_ROWS;
                    s += ';';
                    s += "SSID:";
                    s += wifi_settings.ssid;
                    ws.sendTXT(num, (uint8_t *)s.c_str(), s.length());
                } break;
                case WStype_TEXT: {
                    Serial.printf("[%u] Got Text: %s\n", num, payload);
                    // Print the payload to the LCD screen (LCD_COLS * LCD_ROWS)
                    lcd.clear();
                    lcd.setCursor(0, 0);
                    lcd.print((char *)payload);
                    for (uint8_t i = 0; i < LCD_ROWS; i++) {
                        if (i * LCD_COLS >= length)
                            break;
                        lcd.setCursor(0, i);
                        lcd.print((char *)payload + i * LCD_COLS);
                    }
                } break;
                case WStype_BIN: {
                    Serial.printf("[%u] Got binary length: %u\n", num, length);
                    hexdump(payload, length);
                } break;
                default:
                    break;
            }
        });
        Serial.println("WebSocket Initialized!");
    }

    Serial.println();
    Serial.println("### Firmware Initializing ###");
}

void sendColor(bool shot) {
    tcs_color_t color = rgb.getRaw();
    String      s;
    s += color.r;
    s += ',';
    s += color.g;
    s += ',';
    s += color.b;
    s += ',';
    s += shot;
    ws.sendTXT(client_number, (uint8_t *)s.c_str(), s.length());
}

void loop() {
    ws.loop();
    if (!ws.connectedClients()) {
        static Tmr tmr(250);
        if (tmr)
            led.toggle();
    }

    btn.tick();
    if (btn.press())
        sendColor(true);
    if (btn.holding()) {
        static Tmr tmr(100);
        if (tmr)
            sendColor(false);
    }
}
