#include <Ticker.h>
#include <ArduinoJson.h>

Ticker creditTicker;

#define COIN_PIN   4
#define SLOT_PIN   14
#define LED_PIN    2
#define PIEZO_PIN  13

const unsigned long DEBOUNCE_TIME_MS   = 50;
const unsigned long CREDIT_DELAY_MS    = 200;
const unsigned long BEEP_INTERVAL_MS   = 1000;
const unsigned long LED_BLINK_INTERVAL = 1000;

volatile unsigned long lastPulseTime = 0;
unsigned long lastBeepTime           = 0;
unsigned long lastLEDToggleTime      = 0;
volatile int pulseCount              = 0;

bool hasNewCredit = false;
bool isReady      = false;
bool hasPulse     = false;
bool isNotified   = false;

String data = "";

// Interrupt handler with debounce
void IRAM_ATTR onCoinInterrupt() {
    static unsigned long lastInterruptTime = 0;
    unsigned long currentTime = millis();

    hasPulse = true;

    if ((currentTime - lastInterruptTime) >= DEBOUNCE_TIME_MS) {
        pulseCount++;
        creditTicker.detach();
        creditTicker.once_ms(CREDIT_DELAY_MS, sendCredit);
        lastInterruptTime = currentTime;
    }
}

void handleLED() {
    unsigned long currentMillis = millis();
    if (!isReady) {
        if (currentMillis - lastLEDToggleTime >= LED_BLINK_INTERVAL) {
            digitalWrite(LED_PIN, !digitalRead(LED_PIN));
            lastLEDToggleTime = currentMillis;
        }
    } else {
        digitalWrite(LED_PIN, LOW);
    }
}

void handleBuzzer() {
  // Buzzer logic
    if (digitalRead(SLOT_PIN) && (millis() - lastBeepTime > 1000)) {
        digitalWrite(PIEZO_PIN, !digitalRead(PIEZO_PIN));
        lastBeepTime = millis();
    } else {
        digitalWrite(PIEZO_PIN, LOW);
    }
}

void sendCredit() {
    // Serial.println("Credit detected!");
    hasNewCredit = true;
}

void processData() {
  // Serial.print(data);
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, data);

  if (error) {
      return;
  }

  if(doc["type"] == "status" && doc["value"] == "ok") {
    isReady = true;
  }

  if(doc["type"] == "cmd" && doc["value"] == "open") {
    String message = "{\"type\":\"res\",\"value\":\"open\"}"; 
    Serial.print(message);
    digitalWrite(SLOT_PIN, HIGH);
  }

  if(doc["type"] == "cmd" && doc["value"] == "close") {
    String message = "{\"type\":\"res\",\"value\":\"close\"}"; 
    Serial.print(message);
    digitalWrite(SLOT_PIN, LOW);
  }
}

void setup() {
    // Serial.begin(115200);
    // delay(2000);

    Serial.begin(115200);

    pinMode(COIN_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
    pinMode(SLOT_PIN, OUTPUT);
    pinMode(PIEZO_PIN, OUTPUT);

    String message = "{\"type\":\"init\",\"value\":\"ok\"}"; 
    Serial.print(message);

    attachInterrupt(digitalPinToInterrupt(COIN_PIN), onCoinInterrupt, FALLING);
    // Serial.println("RP2040 UART0 & Coin Interrupt Test");
}

void loop() {
    while (Serial.available()) {
      char c = Serial.read();
      if(c == '\n') {
        processData();
        data = "";
      } else {
        data += c;
      }
    }

    if(hasPulse && !isNotified) {
      String message = "{\"type\":\"notify\",\"value\":\"true\"}"; 
      Serial.print(message);
      isNotified = true;
    }

    if (hasNewCredit) {
        String message = "{\"type\":\"coin\",\"value\":"+String(pulseCount)+"}"; 
        Serial.print(message);
        pulseCount = 0;
        hasPulse = false;
        isNotified = false;
        hasNewCredit = false;  // Reset flag
    }

    handleLED();
    handleBuzzer();
}
