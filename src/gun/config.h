// PIN Configuration
#define LED_PIN  D8
#define TRIG_PIN D9

// Serial Settings
#define BAUD_RATE 74880 // Bootloader have the same baud rate

// OLED Settings
#define OLED_ADDR          0x3D
#define OLED_WIDTH         128
#define OLED_HEIGHT        96
#define OLED_RESET         -1
#define OLED_SPEED_DURING  800000
#define OLED_SPEED_AFTER   200000

// RGB Sensor Settings
#define RGB_ADDR TCS34725_ADDRESS
#define RGB_TIME TCS34725_INTEGRATIONTIME_24MS
#define RGB_GAIN TCS34725_GAIN_16X

// SPIFFS Settings
#define FORMAT_SPIFFS_IF_FAILED true

// Wi-Fi Settings
#define WIFI_SETTINGS_FILE   "/wifi.settings"
#define WIFI_CONNECT_TIMEOUT (20 * 1000)

// Wi-Fi Settings Struct
struct WiFiSettings {
    char    ssid[0x20] = "";
    char    pass[0x20] = "";
    uint8_t mode       = WIFI_AP;
};

// WebSocket Settings
#define WS_PORT     81
#define WS_ORIGIN   ""
#define WS_PROTOCOL "QuackHuntGun"

#define DEBUG 0
