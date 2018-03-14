const Telegraf = require('telegraf')
const DynamoDBSession = require('telegraf-session-dynamodb')

const bot = new Telegraf(process.env.BOT_TOKEN)

const dynamoDBSession = new DynamoDBSession({
    dynamoDBConfig: {
        params: {
            TableName: process.env.AWS_DYNAMODB_TABLE
        },
        region: process.env.AWS_REGION
    }
})
bot.use(dynamoDBSession.middleware())

bot.on('text', (ctx) => {
  ctx.session.counter = ctx.session.counter || 0
  ctx.session.counter++
  console.log('Session', ctx.session)
})

bot.startPolling()