# Type Discord Bot
A discord bot that creates typing competitions for you and your friends to compete in

## Implementation

* This Discord bot facilitates multiplayer typing tests using discord.js and generates random text via web scraping with puppeteer.
* Users can start a typing test with -t start or -t start short, and the bot fetches random text, displays it as an image using the canvas library, and tracks users' typing.
* A MessageCollector monitors player input, checking for accuracy and tracking their progress throughout the test.
* When the game ends (either manually or when time runs out), the bot calculates the words per minute (WPM) and shows the results with player rankings.
* The bot uses reactions, embedded messages, and images to enhance gameplay, offering a fun typing competition experience for Discord users.
