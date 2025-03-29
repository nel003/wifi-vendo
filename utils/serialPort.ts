import { SerialPort } from 'serialport';

class SerialPortSingleton {
    private static instance: SerialPort | null = null;

    private constructor() {}

    public static getInstance(): SerialPort {
        if (!SerialPortSingleton.instance) {
            SerialPortSingleton.instance = new SerialPort({
                path: '/dev/ttyS1',  // Change this to your UART port
                baudRate: 115200,    // Match your device's baud rate
                autoOpen: false
            });

            SerialPortSingleton.instance.open((err) => {
                if (err) {
                    console.error('Error opening serial port:', err.message);
                    return;
                }
                console.log('Serial port opened.');

                SerialPortSingleton.instance?.write(JSON.stringify({type: "status", value: "ok"})+"\n");
            });
        }

        return SerialPortSingleton.instance;
    }
}

export const serialPort = SerialPortSingleton.getInstance();