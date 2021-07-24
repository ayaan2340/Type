const {Client, MessageEmbed, MessageCollector, MessageManager, MessageAttachment, Message} = require('discord.js');
const client = new Client();
const puppeteer = require('puppeteer');
const { createCanvas, measureText, loadImage } = require('canvas');
const math = require('math');
const config = require('./config.json');

var page;
var browser;
var browserWSEndpointMain;
var firstTime = true;

client.on('ready', () => {
  console.log('Type is online');
})  

client.on('message', message => {
  if (message.author == client.user) {
    return;
  }
  if (message.content.startsWith('-t') && !message.channel.isRunning)
  {
    args = message.content.substring(3).split(" ");
    switch (args[0]) {
      case 'help':
        const att = new MessageAttachment('./Pictures/mater.png');
        const helpEmbed = new MessageEmbed()
          .setTitle('Help')
          .setColor('#D22B2B')
          .setDescription('Type is a bot that creates typing tests for you and your friends to compete against each other. There are two modes: short and regular and a game can be stopped with -t end.')
          .setThumbnail('attachment://mater.png')
          .addField('\u200b', '\u200b')
          .addField('🚩 Start the game with an optional short mode (First run might take some time)', '-t start (short)', true)
          .addField('🏁 End the game to see the ranks or run other commands', '-t end', true);
        message.channel.send({files: [att], embed: helpEmbed});
        return;
      break;

      case 'start':
        if (args[1] === 'short') 
        {
          message.channel.isRunning = true;
          message.react('🔴');
          setTimeout(async function() {
            await message.react('🟡');
          }, 200);
          textImage(message, 1);
        }
        else if (args[1]){message.channel.send('Usage: -t help or -t start (short)')}
        else 
        {
          message.channel.isRunning = true;
          message.react('🔴');
          setTimeout(async function() {
            await message.react('🟡');
          }, 200);
          textImage(message, 2);
          return;
        }
      break;
      default:
        message.channel.send('Usage: -t help or -t start (short)');
        return;
    }
  }
});

async function textImage (message, paragraphs) {
  const channelMain = message.channel;
  try {
    var text = await getText(paragraphs);
  }
  catch {
    message.channel.isRunning = false;
    channelMain.send('Could not get text');
    return 1;
  }
  try {
    var canvas = await makeImage(text);
    }
  catch {
    message.channel.isRunning = false;
    channelMain.send('Could not get image');
    return 2;
  }
  try {
    try {
      await message.react('🟢');
    }
    catch {
      message.channel.isRunning = false;
      channelMain.send('Message not found');
      return 3;
    }
    var attachment = new MessageAttachment(canvas.toBuffer(), 'text.png')
    var textEmbed = new MessageEmbed()
      .setColor('#7289da')
      .setTitle('Type!     🚗')
      .setDescription('-t end to end')
      .attachFiles([attachment])
      .setImage('attachment://text.png');

    var botMessage;
    await message.channel.send(textEmbed).then((sentMessage) => {
      botMessage = sentMessage;
    });
  }
  catch {
    message.channel.isRunning = false;
    channelMain.send('Could not send embed');
    return 4;
  }
  try {
    collect(text, message, paragraphs, botMessage, attachment);
  }
  catch {
    message.channel.isRunning = false;
    channelMain.send('Error while running game');
    return 5;
  }
  return 0;
}

async function makeImage(text)
{
  try {
    const width = 1200;
    const height = 900;
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');

    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.shadowColor = '#2c2f33';
    context.shadowBlur = 20;
    context.shadowOffsetY = 2;
    context.shadowOffsetX = 2;
    context.strokeStyle = "#7289da";
    context.lineWidth = 10;
    context.strokeRect(5, 5, width - 10, height - 10);
    context.font = '32pt Arial';
    context.textAlign = 'left';
    context.fillStyle = '#000000';
    
    var lines = getLines(context, text, (width - 80));
    if (lines.length <= 10)
    {
      context.shadowOffsetY = 0;
      context.shadowOffsetX = 0;
      context.shadowBlur = 40;
      await loadImage('./Pictures/peepowidehappy.png').then(image => {
        context.drawImage(image, 0, 600);
      });
    }
    for (var j = 0; j < lines.length; j++) 
    {
      context.shadowBlur = 0;
      context.fillText(lines[j], 40, (j + 1) * 60);
    }
    return canvas;
  }
  catch (error) {
    return error;
  }
}

async function getText(paragraphs) 
{
  try {
    var element;
    var text = "";
    var sentences = "";
    var pages;


    if (firstTime)
    {
      browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],
      }); 
      page = await browser.newPage();
      await page.setRequestInterception(true);
      page.setDefaultNavigationTimeout(0);
      page.on('request', request => 
      {
        if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet' || request.resourceType() === 'font')
          request.abort();
        else
          request.continue();
      });
      await page.setViewport({ width: 1200, height: 800, });
      await page.goto('https://randomwordgenerator.com/paragraph.php');
      browserWSEndpointMain = browser.wsEndpoint();
      firstTime = false;
    }
    else {
      try {
        browser = await puppeteer.connect({ browserWSEndpoint: browserWSEndpointMain });
        pages = await browser.pages();
        page = pages[0];
      }
      catch (error) {
        console.log(error);
        return error;
      }
    }
    if (paragraphs != 1) 
    {
      await page.waitForSelector('#btn_submit_generator');
      await page.click('#btn_submit_generator');
      await page.waitForSelector('.support-paragraph');
      element = await page.$('.support-paragraph');
      text = await page.evaluate(el => el.textContent, element);
    }
    else 
    {
      await page.waitForSelector('#btn_submit_generator');
      await page.click('#btn_submit_generator');
      await page.waitForSelector('.support-paragraph')
      element = await page.$('.support-paragraph');
      text = await page.evaluate(el => el.textContent, element);
      sentences = text.match( /[^\.!\?]+[\.!\?]+/g );
      text = sentences[0] + " " + sentences[1];
    }
    browser.disconnect();
    return text;
  }
  catch (error) {
    browser.disconnect();
    console.log(error);
    return error;
  }
}

function getLines(context, text, maxWidth) {
  var words = text.split(" ");
  var lines = [];
  var currentLine = words[0];
  for (var i = 1; i < words.length; i++) {
      var word = words[i];
      var width2 = context.measureText(currentLine + " " + word).width;
      if (width2 < maxWidth) {
          currentLine += " " + word;
      } else {
          lines.push(currentLine);
          currentLine = word;
      }
  }
  lines.push(currentLine);
  return lines;
}

function collect(text, message, paragraphs, botMessage, imageA) 
{
  try {
    message.channel.words = text.match(/\S+/g);
    message.channel.timer = 60 * paragraphs;
    message.channel.players; 
    message.channel.players = [];
    message.channel.dict = {};

    const filter = m => true;
    const collector = message.channel.createMessageCollector(filter, 60 * paragraphs);

    var timerInterval = setInterval(function () {
      message.channel.timer--;
      if (message.channel.timer == 0) 
      {
        collector.stop();
      }
    }, 1000);

    const attachment = imageA;
    var editTimerInterval = setInterval(function () {
      const receivedEmbed = botMessage.embeds[0];
      var editedEmbed = new MessageEmbed(receivedEmbed).setDescription("🕧  " + message.channel.timer.toString() + " seconds remaining").attachFiles([attachment]).setImage('attachment://text.png');
      botMessage.edit(editedEmbed);
    }, 5500);


    collector.on('collect', (m) => {
      var exists = false;
      for (let z = 0; z < message.channel.players.length; z++)
      {
        if (m.author.username === message.channel.players[z].Name) {
          exists = true;
          break;
        }
      }
      mWords = m.content.match(/\S+/g);
      var correct = false;
      for (let x = 0; x < mWords.length; x++)
      {
        if (mWords[x] !== message.channel.words[x])
        {
          correct = false;
          break;
        }
        else 
        {
          correct = true;
        }
      }
      if (correct && !exists)
      {
        message.channel.dict = {Name: m.author.username, Time: message.channel.timer};
        message.channel.players.push(message.channel.dict);
        m.channel.send(m.author.username + " has finished");
        m.delete(m);
      }
      else if (m.author == botMessage.author) {}
      else if (m.content.startsWith('-t')) {
        if (m.content === '-t end')
        {
          collector.stop();
        }
        else if (m.content === '-t start')
        {
          m.channel.send("'-t end' first")
        }
        else
        {
          m.channel.send('Usage: -t end to end first')
        }
      }
      else 
      {
        m.delete(m);
      }
    });
    collector.on('end', () => {
      clearInterval(editTimerInterval);
      clearInterval(timerInterval);
      message.channel.finish = message.channel.timer;
      const receivedEmbed = botMessage.embeds[0];
      var editedEmbed = new MessageEmbed(receivedEmbed).setDescription("Finished").attachFiles([attachment]).setImage('attachment://text.png');
      botMessage.edit(editedEmbed);
      if (message.channel.finish < 0)
      {
        message.channel.finish = 0;
      }
      const resultEmbed = new MessageEmbed()
      .setColor('#7DF9FF')
      .setTitle('Results')
      .setDescription(message.channel.words.length.toString() + " words typed with " + message.channel.finish.toString() + " seconds remaining")
      .setThumbnail('https://static.wikia.nocookie.net/pixar/images/1/1e/GuidoCars3Artwork.jpg/revision/latest?cb=20170430135600')
      .addField('\u200b', '\u200b');
      
      message.channel.WPM = 0;
      for (let i = 0; i < message.channel.players.length; i++)
      {
        message.channel.WPM = math.round((60 * message.channel.words.length) / (paragraphs * 60 - message.channel.players[i].Time));
        resultEmbed.addField("🏆  " + (i + 1).toString() + "  -  " + message.channel.players[i].Name, (paragraphs * 60 - message.channel.players[i].Time.toString()) + " seconds : " + message.channel.WPM.toString() + " WPM ");
      }
      message.channel.send(resultEmbed);
      message.channel.isRunning = false;
      return;
    });
  }
  catch (error) {
    return error;
  }
}

process.on('exit', () => {
  browser.close();
});

client.login(config.token);


