[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com) [![Build Status](https://travis-ci.org/nessgor/telegraf-session-dynamodb.svg?branch=master)](https://travis-ci.org/nessgor/telegraf-session-dynamodb) 
[![bitHound Overall Score](https://www.bithound.io/github/nessgor/telegraf-session-dynamodb/badges/score.svg)](https://www.bithound.io/github/nessgor/telegraf-session-dynamodb) [![bitHound Dependencies](https://www.bithound.io/github/nessgor/telegraf-session-dynamodb/badges/dependencies.svg)](https://www.bithound.io/github/nessgor/telegraf-session-dynamodb/master/dependencies/npm) [![bitHound Dev Dependencies](https://www.bithound.io/github/nessgor/telegraf-session-dynamodb/badges/devDependencies.svg)](https://www.bithound.io/github/nessgor/telegraf-session-dynamodb/master/dependencies/npm)

[![NPM](https://nodei.co/npm/telegraf-session-dynamodb.png)](https://nodei.co/npm/telegraf-session-dynamodb/)

# AWS DynamoDB session middleware for Telegraf

AWS DynamoDB powered session middleware for [Telegraf](https://github.com/telegraf/telegraf).

## Prerequisites

1. You have made your AWS access and secret key available through a provided method, like storing them in the ~/.aws/credentials file or export them into environment variables
2. You need to install Node.js  with a minimum version of 6.10.3 

## Installation

```js
$ yarn add telegraf-session-dynamodb
```

## Example

```js
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
```

When you have stored the session key beforehand, you can access a
session without having access to a context object. This is useful when
you perform OAUTH or something similar, when a REDIRECT_URI is called
on your bot server.

```js
const dynamoDBSession = new DynamoDBSession({
    dynamoDBConfig: {
        params: {
            TableName: process.env.AWS_DYNAMODB_TABLE
        },
        region: process.env.AWS_REGION
    }
})

// Retrieve session state by session key
dynamoDBSession.getSession(key)
  .then((session) => {
    console.log('Session state', session)
  })

// Save session state
dynamoDBSession.saveSession(key, session)
```

## API

### Options

* `dynamoDBConfig`:
  * `params`: 
    * `TableName`: AWS DynamoDB Table to store session (default: *bot-session*)
  * `region`: AWS Region (default: *ap-northeast-1*)
* `property`: context property name (default: `session`)
* `getSessionKey`: session key resolver function `(ctx) => any`)

Default implementation of `getSessionKey`:

```js
function getSessionKey(ctx) {
  if (!ctx.from || !ctx.chat) {
    return
  }
  return `${ctx.from.id}:${ctx.chat.id}`
}
```

### Destroying a session

To destroy a session simply set it to `null`.

```js
bot.on('text', (ctx) => {
  ctx.session = null
})

```

### Local Unit Testing

```js
$ yarn

$ yarn global add serverless

$ docker pull lambci/lambda

$ sls dynamodb install

$ sls offline start -r ap-northeast-1 --noTimeout &

$ yarn test:local

```

### Acknowledgement
* [telegraf-session-redis](https://github.com/telegraf/telegraf-session-redis)