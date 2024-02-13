#pragma once

#define STR_HELPER(x) #x
#define STR(x) STR_HELPER(x)

#define MAJOR_VERSION    1
#define MINOR_VERSION    0
#define PATCH_VERSION    0
#define FIRMWARE_VERSION ("v" STR(MAJOR_VERSION) "." STR(MINOR_VERSION) "." STR(PATCH_VERSION))
#define FIRMWARE_MAGIC   (MAJOR_VERSION << 24 | MINOR_VERSION << 16 | PATCH_VERSION << 8 | 0x00)

// PIN Configuration
#if defined(ESP32)
#   define LED_PIN  (D8)
#   define TRIG_PIN (D9)
#elif defined(ESP8266)
#   define LED_PIN  (D8)
#   define TRIG_PIN (D7)
#else
#   error "Unsupported platform"
#endif

// Serial Settings
#define BAUD_RATE 74880 // Bootloader have the same baud rate

// OLED Settings
#define OLED_ADDR          (0x3D)
#define OLED_WIDTH         (128)
#define OLED_HEIGHT        (96)
#define OLED_RESET         (-1)
#define OLED_SPEED_DURING  (800000)
#define OLED_SPEED_AFTER   (200000)

// RGB Sensor Settings
#define RGB_ADDR (TCS34725_ADDRESS)
#define RGB_TIME (TCS34725_INTEGRATIONTIME_24MS)
#define RGB_GAIN (TCS34725_GAIN_16X)

// LittleFS Settings
#if defined(ESP32)
#   define FORMAT_LITTLEFS_IF_FAILED (true)
#elif defined(ESP8266)
#   define FORMAT_LITTLEFS_IF_FAILED
#else
#   error "Unsupported platform"
#endif

// Wi-Fi Settings
#define WIFI_AP_IP           192, 168, 1, 1
#define WIFI_AP_SUBNET       255, 255, 255, 0
#define WIFI_SETTINGS_FILE   ("/wifi.settings")
#define WIFI_CONNECT_TIMEOUT (20 * 1000)

// Wi-Fi Settings Struct
#define SSID_SIZE (0x20)
#define PASS_SIZE (0x40)
struct WiFiSettings {
    uint32_t magic             = FIRMWARE_MAGIC;
    char    ssid[SSID_SIZE]    = "";
    char    pass[PASS_SIZE]    = "";
    char    ap_ssid[SSID_SIZE] = "QHG Config";
    char    ap_pass[PASS_SIZE] = "quackhuntgun";
    uint8_t mode               = WIFI_AP;
};

// WebSocket Settings
#define WS_PORT     (81)
#define WS_ORIGIN   ("")
#define WS_PROTOCOL ("QuackHuntGun")

#define DEBUG 0
