# Vinyl Capture

Vinyl Capture is a small desktop recorder for USB turntables such as the Sony LX-300USB. It uses the computer’s standard audio-input APIs, so the turntable does not need a special driver or proprietary software. Recordings are uncompressed 16-bit PCM WAV files.

## Run it

```sh
npm install
npm start
```

To build installers for the current computer’s three desktop platforms:

```sh
npm run dist
```

## Use it

1. Connect the turntable’s USB cable and switch it on.
2. Select the Sony/USB audio input in **Record from**.
3. Choose WAV for maximum compatibility, or FLAC for lossless compression.
4. Start playback, check that the meter is moving without staying at 100%, then click **Start recording**.
5. Click **Stop** and choose where to save the recording.

The **Test simulator** button creates a short synthetic input so the interface and WAV/FLAC save paths can be checked without hardware.

macOS may ask for Microphone permission the first time. If the turntable is not listed, open System Settings → Privacy & Security → Microphone and allow Vinyl Capture, then use Refresh.

## Current limitation

This first version records the USB audio stream as one continuous file. Track splitting, album metadata, and automatic silence detection can be added after live testing establishes the LX-300USB’s actual sample rate, channel layout, and device labels on the target Mac.
