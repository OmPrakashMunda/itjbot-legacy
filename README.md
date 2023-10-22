## Overview

ITJ-BOT is built using the [WhatsApp Web API](https://github.com/pedroslopez/whatsapp-web.js) and integrates several other libraries and APIs to enhance its functionality. Below are some of the key components used in ITJ-BOT:

- `whatsapp-web.js`: A library for interacting with WhatsApp Web.
- `axios`: A library for making HTTP requests.
- `qrcode-terminal`: Generates QR codes for WhatsApp Web authentication.
- `moment-timezone`: Used for handling time and time zones.
- `express`: A Node.js web application framework.
- `cors`: Middleware for enabling Cross-Origin Resource Sharing.
- `node-fetch`: A module for making HTTP requests similar to the `fetch` API in the browser.
- `@sentry/node`: A library for error monitoring and reporting.
- `btoa`: Used for Base64 encoding.
- Other custom modules and code for various functionalities.

## Features

ITJ-BOT provides a variety of features, including but not limited to:

- Sending messages to WhatsApp contacts.
- Converting media (images, videos, and GIFs) to stickers.
- Downloading media from YouTube, Instagram, and Spotify.
- Handling voice notes and transcribing audio messages.
- Responding to user messages with AI-generated responses.
- Handling and processing various types of messages, including [commands](https://github.com/OmPrakashMunda/itjbot-legacy#commands).

## Installation

Before using ITJ-BOT, you must install and configure the required dependencies. You can use `npm` or `yarn` to install the necessary packages as defined in the `package.json` file. Ensure you have Node.js installed on your system.

```bash
npm install
# or
yarn install
```

## Configuration

ITJ-BOT requires configuration parameters, such as your WhatsApp authentication credentials, URLs for various APIs, and other settings. You can configure the bot in the `config/config.json` file. Be sure to fill in the required values.

## Usage

1. **Authentication:** To start using ITJ-BOT, you need to authenticate it with your WhatsApp account. This can be done by scanning the QR code generated when you run the bot.

2. **API Usage:** ITJ-BOT provides several endpoints for sending messages and accessing information. You can send messages by making HTTP requests to these endpoints.

3. **Commands:** ITJ-BOT recognizes specific commands that begin with a hyphen (`-`). These commands trigger various actions, such as media downloads or interactions with AI models.

4. **Logging:** ITJ-BOT logs interactions, including user messages and bot responses, in a log file.

5. **Error Reporting:** ITJ-BOT is configured to use Sentry for error monitoring and reporting. Any errors encountered will be logged and reported.

## Commands
**Note:** Every command should commence with a hyphen (` - `), and it is essential that spelling is accurate.

**Imagine:** This command is used to genetare AI imgaes using stable diffusion

**Usage**
`-imagine <prompt>`

**Example**
`-imagine astronaut riding a horse`

Current this feature is only for beta testers.
**mp3:** This command is used to download the content in mp3 format (Youtube and Instagram)

**Usage**
`-mp3 <url>`

**Example**
`-mp3 https://www.youtube.com/watch?v=dQw4w9WgXcQ`


## Important Notes

- **Upgrading Plans:** ITJ-BOT includes features that may require different user plans. Users are informed about their plan level and the features they can access based on their plan.

- **Command Reference:** For a list of available commands, users can refer to the [ITJ-BOT documentation](https://itjbot.itjupiter.tech/docs/#commands).

- **Terms and Policies:** Users can review the terms and policies of ITJ-BOT by visiting the [Terms and Conditions page](https://itjbot.itjupiter.tech/terms/).

## Support and Contact

For support or any inquiries related to ITJ-BOT, please contact the support team at `support@itjupiter.tech`.

## Reporting Issues

If you encounter any issues while using ITJ-BOT or have suggestions for improvements, please feel free to create an issue on the project's GitHub repository.

## License

ITJ-BOT is provided under the license terms defined in the project's repository. Please review the licensing terms before using the code.
