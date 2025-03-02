#include <Arduino.h>
#if defined(ESP32)
#   include <WiFi.h>
#elif defined(ESP8266)
#   include <ESP8266WiFi.h>
#else
#   error "Unsupported platform"
#endif
#include <EncButton.h>
#include <FS.h>
#include <LittleFS.h>
#include <GyverPortal.h>
#include <WebSocketsServer.h>
#include <Wire.h>

#include <Adafruit_SSD1327.h>
#include "TCS34725.hpp"
#include "config.h"
#include "led.hpp"
#include "tmr.hpp"

// --- Global Device Variables ---
Button           btn(TRIG_PIN);     // For button handling
Led              led(LED_PIN);      // For LED controlling
Adafruit_SSD1327 oled(              // For OLED Display
    OLED_WIDTH, OLED_HEIGHT, 
    &Wire,
    OLED_RESET,
    OLED_SPEED_DURING,
    OLED_SPEED_AFTER);
TCS34725         rgb(               // For RGB Sensor reading
    &Wire,
    RGB_ADDR,
    RGB_TIME,
    RGB_GAIN);
WebSocketsServer ws(                // For WebSocket
    WS_PORT,
    WS_ORIGIN,
    WS_PROTOCOL);

// --- Global Logic Variables ---
WiFiSettings     wifi_settings;     // For Wi-Fi
uint8_t          ws_client = 0;     // For WebSocket

void __attribute__((weak)) hexdump(const void* mem, uint32_t len, uint8_t cols);

void portal_build(GyverPortal &p);
void portal_action(GyverPortal &p);

void setup() {
    // Setup Serial
    {
        Serial.begin(BAUD_RATE);
        Serial.println();
        Serial.println();
        Serial.println("### Firmware Initializing ###");
    }

    // Setup OLED Display
    {
        Serial.println();
        Serial.println("Initializing OLED Display");

        if (!oled.begin(OLED_ADDR)) {
            Serial.println("OLED allocation failed");
            for (;;) {
                led.toggle();
                if (oled.begin(OLED_ADDR))
                    break;
                delay(100);
            }
            led.off();
        }

        oled.clearDisplay();
        oled.setTextSize(2);
        oled.setTextColor(SSD1327_WHITE);
        oled.setCursor(0, 0);
        oled.println("QuackHunt");
        oled.display();

        Serial.println("OLED Display Initialized!");
    }

    // Setup RGB Sensor
    {
        Serial.println();
        Serial.println("Initializing RGB Sensor");

        if (!rgb.begin()) {
            Serial.println("No TCS34725 found");

            oled.clearDisplay();
            oled.setTextSize(2);
            oled.setTextColor(SSD1327_WHITE);
            oled.setCursor(0, 0);
            oled.println("QuackHunt");
            oled.setTextColor(SSD1327_BLACK);
            oled.setTextSize(1);
            oled.println("No TCS34725 found");
            oled.display();

            for (;;) {
                led.toggle();
                if (rgb.begin())
                    break;
                delay(100);
            }
            led.off();
        }

        Serial.println("RGB Sensor Initialized!");
    }

    // Setup LittleFS
    {
        Serial.println();
        Serial.println("Initializing LittleFS");

        if(!LittleFS.begin(FORMAT_LITTLEFS_IF_FAILED)){
            Serial.println("LittleFS Mount Failed");

            oled.clearDisplay();
            oled.setTextSize(2);
            oled.setTextColor(SSD1327_WHITE);
            oled.setCursor(0, 0);
            oled.println("QuackHunt");
            oled.setTextColor(SSD1327_BLACK);
            oled.setTextSize(1);
            oled.println("LittleFS Mount Failed");
            oled.display();

            for (;;) {
                led.toggle();
                if (LittleFS.begin(FORMAT_LITTLEFS_IF_FAILED))
                    break;
                delay(100);
            }
            led.off();
        }

        Serial.println("LittleFS Initialized!");
    }

    // Setup WiFi Settings
    {
        Serial.println();
        Serial.println("Initializing Wi-Fi Settings");

        if (!LittleFS.exists(WIFI_SETTINGS_FILE)) {
            Serial.println("No Wi-Fi settings found");
            Serial.println("Creating default Wi-Fi settings");

            File file = LittleFS.open(WIFI_SETTINGS_FILE, "w");
            if (!file) {
                Serial.println("Failed to create default Wi-Fi settings");

                oled.clearDisplay();
                oled.setTextSize(2);
                oled.setTextColor(SSD1327_WHITE);
                oled.setCursor(0, 0);
                oled.println("QuackHunt");
                oled.setTextColor(SSD1327_BLACK);
                oled.setTextSize(1);
                oled.println("Failed to create default Wi-Fi settings");
                oled.display();
                
                LittleFS.remove(WIFI_SETTINGS_FILE);

                // Delay for 5 seconds to allow the user to see the error message
                delay(5000);
                ESP.restart();
            }
            file.write((uint8_t *)&wifi_settings, sizeof(wifi_settings));
            file.close();

            Serial.println("Default Wi-Fi settings created!");
        } else {
            Serial.println("Reading Wi-Fi settings");

            File file = LittleFS.open(WIFI_SETTINGS_FILE, "r");
            file.read((uint8_t *)&wifi_settings, sizeof(wifi_settings));
            file.close();

            // Check magic number
            if (wifi_settings.magic != FIRMWARE_MAGIC) {
                Serial.println("Wi-Fi settings magic number mismatch");
                Serial.println("Restoring default Wi-Fi settings");

                oled.clearDisplay();
                oled.setTextSize(2);
                oled.setTextColor(SSD1327_WHITE);
                oled.setCursor(0, 0);
                oled.println("QuackHunt");
                oled.setTextColor(SSD1327_BLACK);
                oled.setTextSize(1);
                oled.println("Wi-Fi settings magic number mismatch");
                oled.display();

                LittleFS.remove(WIFI_SETTINGS_FILE);

                // Delay for 5 seconds to allow the user to see the error message
                delay(5000);
                ESP.restart();
            }
        }
#if DEBUG
        Serial.println("Data read:");
        Serial.println(wifi_settings.ssid);
        Serial.println(wifi_settings.pass);
        Serial.println(wifi_settings.mode == 1   ? "WIFI_STA"
                       : wifi_settings.mode == 2 ? "WIFI_AP"
                                                 : "UNK");
#endif
        Serial.println("WiFi Settings Initialized!");
    }

    // Setup Wi-Fi
    {
        Serial.println();
        Serial.println("Initializing Wi-Fi");

        // Delay for 2 seconds to allow the user to press the button to enter
        // the Wi-Fi Portal
        delay(2000);

        btn.tick();
        if (wifi_settings.ssid[0] != '\0' && !btn.read()) {
            // There is a saved Wi-Fi configuration
            Serial.print("Connecting to saved Wi-Fi: ");
            Serial.print(wifi_settings.ssid);

            oled.clearDisplay();
            oled.setTextSize(2);
            oled.setTextColor(SSD1327_WHITE);
            oled.setCursor(0, 0);
            oled.println("QuackHunt");
            oled.setTextSize(1);
            oled.println("Connecting to Wi-Fi");
            oled.print(wifi_settings.ssid);
            oled.display();

            WiFi.begin(wifi_settings.ssid, wifi_settings.pass);
            uint32_t tmr = millis();
            while (WiFi.status() != WL_CONNECTED) {
                Serial.print(".");
                oled.print(".");
                oled.display();
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

                oled.clearDisplay();
                oled.setTextSize(2);
                oled.setTextColor(SSD1327_WHITE);
                oled.setCursor(0, 0);
                oled.println("QuackHunt");
                oled.setTextSize(1);
                oled.print("IP: ");
                oled.println(WiFi.localIP());
                oled.display();
            }
        }

        btn.tick();
        if (WiFi.status() != WL_CONNECTED || btn.read() || wifi_settings.mode == WIFI_AP) {
            // There is no saved Wi-Fi configuration or the saved Wi-Fi
            // configuration is invalid
            Serial.println(
                "No saved Wi-Fi configuration or the saved Wi-Fi configuration is invalid");
            Serial.println("Starting Wi-Fi Portal");

            // Set Wi-Fi mode to AP
            WiFi.softAPdisconnect();
            WiFi.disconnect();
            IPAddress apIP(WIFI_AP_IP);
            IPAddress subnet(WIFI_AP_SUBNET);
            WiFi.mode(WIFI_AP);
            WiFi.softAPConfig(apIP, apIP, subnet);
            WiFi.softAP(wifi_settings.ap_ssid, wifi_settings.ap_pass);

            // Start Wi-Fi Portal
            GyverPortal gp(&LittleFS);
            gp.attachBuild(portal_build);
            gp.attach(portal_action);
            gp.start();
            gp.enableOTA();

            Serial.println("Wi-Fi Portal Started!");
            Serial.print("SSID: ");
            Serial.println(wifi_settings.ap_ssid);
            Serial.print("Password: ");
            Serial.println(wifi_settings.ap_pass);
            Serial.print("IP Address: ");
            Serial.println(WiFi.softAPIP());
            Serial.println("Portal log:");

            oled.clearDisplay();
            oled.setTextSize(2);
            oled.setTextColor(SSD1327_WHITE);
            oled.setCursor(0, 0);
            oled.println("QuackHunt");
            oled.setTextSize(1);
            oled.println("Starting Wi-Fi Portal");
            oled.print("SSID: ");
            oled.println(wifi_settings.ap_ssid);
            oled.print("Pass: ");
            oled.println(wifi_settings.ap_pass);
            oled.print("IP: ");
            oled.println(WiFi.softAPIP());
            oled.display();

            while (true) {
                if (!gp.tick()) {
                    Serial.println("Saving Wi-Fi configuration");
                    File file = LittleFS.open(WIFI_SETTINGS_FILE, "w");
                    if (!file) {
                        Serial.println("Failed to save Wi-Fi configuration");

                        oled.clearDisplay();
                        oled.setTextSize(2);
                        oled.setTextColor(SSD1327_WHITE);
                        oled.setCursor(0, 0);
                        oled.println("QuackHunt");
                        oled.setTextColor(SSD1327_BLACK);
                        oled.setTextSize(1);
                        oled.println("Failed to save Wi-Fi configuration");
                        oled.display();

                        LittleFS.remove(WIFI_SETTINGS_FILE);

                        // Delay for 5 seconds to allow the user to see the error message
                        delay(5000);
                        ESP.restart();
                    }
                    file.write((uint8_t *)&wifi_settings, sizeof(wifi_settings));
                    file.close();

                    Serial.println("Wi-Fi configuration saved!");
                    Serial.println("Restarting...");
                    ESP.restart();
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

                    oled.clearDisplay();
                    oled.setTextSize(2);
                    oled.setTextColor(SSD1327_WHITE);
                    oled.setCursor(0, 0);
                    oled.println("QuackHunt");
                    oled.setTextSize(1);
                    oled.print("IP: ");
                    oled.println(WiFi.localIP());
                    oled.println("Disconnected!");
                    oled.display();
                } break;
                case WStype_CONNECTED: {
                    ws_client = num;
                    led.on();
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
                    s += "VERSION:";
                    s += FIRMWARE_VERSION;
                    s += ';';
                    s += "WIFI:";
                    s += wifi_settings.ssid;
                    s += ',';
                    s += wifi_settings.pass;
                    s += ';';
                    s += "AP:";
                    s += wifi_settings.ap_ssid;
                    s += ',';
                    s += wifi_settings.ap_pass;
                    s += ';';
                    s += "OLED:";
                    s += OLED_WIDTH;
                    s += ',';
                    s += OLED_HEIGHT;
                    s += ';';
                    ws.sendTXT(num, (uint8_t *)s.c_str(), s.length());

                    // Send save.bin if it exists
                    File file = LittleFS.open("/save.bin", "r");
                    if (file) {
                        uint8_t *buf = (uint8_t *)malloc(file.size());
                        if (buf) {
                            file.read(buf, file.size());
                            ws.sendBIN(num, buf, file.size());
                            free(buf);
                        }
                        file.close();
                    }
                } break;
                case WStype_TEXT: {
                    Serial.printf("[%u] Got Text: %s\n", num, payload);

                    oled.clearDisplay();
                    oled.setTextSize(2);
                    oled.setTextColor(SSD1327_WHITE);
                    oled.setCursor(0, 0);
                    oled.println("QuackHunt");
                    oled.setTextSize(1);
                    oled.print("IP: ");
                    oled.println(WiFi.localIP());
                    oled.println((char *)payload);
                    oled.display();
                } break;
                case WStype_BIN: {
                    Serial.printf("[%u] Got binary length: %u\n", num, length);
                    hexdump(payload, length, 16);

                    // Store the binary data to a file
                    File file = LittleFS.open("/save.bin", "w");
                    if (!file) {
                        Serial.println("Failed to open file for writing");
                        break;
                    }
                    file.write(payload, length);
                    file.close();
                } break;
                default:
                    break;
            }
        });

        Serial.println("WebSocket Initialized!");
    }

    Serial.println();
    Serial.println("### Firmware Initialized ###");
}

void sendColor(bool shot) {
    uint16_t clear, red, green, blue;
    rgb.getRGBC(&red, &green, &blue, &clear);

    String s;
    s += red;
    s += ',';
    s += green;
    s += ',';
    s += blue;
    s += ',';
    s += shot;

    Serial.println(s);

#if DEBUG
    oled.clearDisplay();
    oled.setTextSize(2);
    oled.setTextColor(SSD1327_WHITE);
    oled.setCursor(0, 0);
    oled.println("QuackHunt");
    oled.setTextSize(1);
    oled.print("IP: ");
    oled.println(WiFi.localIP());
    oled.println(s);
    oled.display();
#endif

    ws.sendTXT(ws_client, (uint8_t *)s.c_str(), s.length());
}

void loop() {
    ws.loop();
    if (!ws.connectedClients()) {
        static Tmr tmr(250);
        if (tmr)
            led.toggle();
    }
    else
        led.off();

    btn.tick();
    if (btn.press())
        sendColor(true);

    if (btn.holding()) {
        static Tmr tmr(100);
        if (tmr)
            sendColor(false);
    }
}

IRAM_ATTR
void __attribute__((weak)) hexdump(const void* mem, uint32_t len, uint8_t cols)
{
    const char* src = (const char*)mem;
    Serial.printf("\n[HEXDUMP] Address: %p len: 0x%X (%d)", src, len, len);
    while (len > 0)
    {
        uint32_t linesize = cols > len ? len : cols;
        Serial.printf("\n[%p] 0x%04x: ", src, (int)(src - (const char*)mem));
        for (uint32_t i = 0; i < linesize; i++)
        {
            Serial.printf("%02x ", *(src + i));
        }
        Serial.printf("  ");
        for (uint32_t i = linesize; i < cols; i++)
        {
            Serial.printf("   ");
        }
        for (uint32_t i = 0; i < linesize; i++)
        {
            unsigned char c = *(src + i);
            Serial.print(isprint(c) ? c : '.');
        }
        src += linesize;
        len -= linesize;
        optimistic_yield(10000);
    }
    Serial.printf("\n");
}

// Wi-Fi Portal

void portal_build(GyverPortal &p) {
    if (LittleFS.exists("/gp_data/scripts.js"))
        GP.BUILD_BEGIN_FILE("GP_DARK", 1600);
    else
        GP.BUILD_BEGIN(GP_DARK, 1600);

    GP.GRID_RESPONSIVE(1350);

    GP.TITLE("QuackHunt Gun Configuration");

    M_GRID(
        M_BLOCK(
            GP_TAB,
            "",
            "Wi-Fi Settings",
            M_FORM(
                "/connect",
                "Apply",
                M_BOX(GP.LABEL("SSID");     GP.TEXT("ssid", "SSID",     wifi_settings.ssid, "", SSID_SIZE););
                M_BOX(GP.LABEL("Password"); GP.PASS("pass", "Password", wifi_settings.pass, "", PASS_SIZE););
            );
        );
        
        M_BLOCK(
            GP_TAB,
            "",
            "AP Settings",
            M_FORM(
                "/ap",
                "Apply",
                M_BOX(GP.LABEL("SSID");     GP.TEXT("ap_ssid", "SSID",     wifi_settings.ap_ssid, "", SSID_SIZE););
                M_BOX(GP.LABEL("Password"); GP.PASS("ap_pass", "Password", wifi_settings.ap_pass, "", PASS_SIZE););
            );
        );

        M_BLOCK(
            GP_TAB,
            "",
            "Reset",
            M_FORM(
                "/reset",
                "Reset",
                ;
            );
        );
        
        M_BLOCK(
            GP_TAB,
            "",
            "OTA Update",
            M_BOX(GP.OTA_FIRMWARE(););
            M_BOX(GP.OTA_FILESYSTEM(););
        );
    );
        
    M_GRID(
        M_BLOCK(
            GP_TAB,
            "",
            "Debug Stuff",
            M_BOX(GP.SYSTEM_INFO(FIRMWARE_VERSION););
        );
        
        M_BLOCK(
            GP_TAB,
            "",
            "File Manager",
            M_BLOCK(
                GP_THIN,
                "-webkit-fill-available",
                M_BOX(GP.FILE_UPLOAD("file_upl", "Upload File"););
                M_BOX(GP.FOLDER_UPLOAD("folder_upl", "Upload Folder"););
            );
            M_BLOCK(
                GP_THIN,
                "-webkit-fill-available",
                M_BOX(GP.FILE_MANAGER(&LittleFS););
            );
        );
    );

    GP.ONLINE_CHECK();

    GP.JS_BEGIN();
    GP.SEND("document.title = 'QuackHunt Gun Configuration';");
    GP.JS_END();

    GP.BUILD_END();
}

void portal_action(GyverPortal &p) {
    if (p.form("/connect")) {
        p.copyStr("ssid", wifi_settings.ssid);
        p.copyStr("pass", wifi_settings.pass);
        wifi_settings.mode = WIFI_STA;
        WiFi.softAPdisconnect();
        p.stop();
    }
    if (p.form("/ap")) {
        p.copyStr("ap_ssid", wifi_settings.ap_ssid);
        p.copyStr("ap_pass", wifi_settings.ap_pass);
        wifi_settings.mode = WIFI_AP;
        WiFi.softAPdisconnect();
        p.stop();
    }
    if (p.form("/reset")) {
        LittleFS.remove(WIFI_SETTINGS_FILE);
        ESP.restart();
    }
    if (p.uploadEnd()) {
        Serial.print("Uploaded file: ");
        Serial.print(p.fileName());
        Serial.print(", from: ");
        Serial.println(p.uploadName());
    }
}
