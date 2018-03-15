const DynamoDBHelper = require('./dynamodb-helper');

class DynamoDBSession {
  constructor(options) {
    this.options = Object.assign({
      property: 'session',
      getSessionKey: (ctx) => ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`,
      dynamoDBConfig: {
        params: {
          TableName: 'telegraf-session-dynamodb' // override this value to your table
        },
        region: 'ap-northeast-1' // override this value to your region
      }
    }, options);

    this._db = new DynamoDBHelper(this.options.dynamoDBConfig);
  }

  createSession(key) {
    let params = {
      Item: {
        SessionKey: key,
        SessionValue: {}
      }
    };
    return this._db.create(params)
      .catch((err) => console.log(err));
  }

  getSession(key) {
    let params = {
      Key: {
        SessionKey: key
      }
    };
    return this._db.read(params)
      .then((data) => {
        if (!data.Item || Object.keys(data.Item).length === 0) {
          return this.createSession(key)
            .then(() => new Object())
            .catch((err) => console.log(err));
        }
        let session = data.Item.SessionValue;
        return (typeof session === "string") ? JSON.parse(session) : session;
      })
      .catch((err) => console.log(err));
  }

  saveSession(key, session) {
    if (!session || Object.keys(session).length === 0) {
      return this.clearSession(key)
    }
    let params = {
      Key: {
        SessionKey: key
      },
      UpdateExpression: 'set SessionValue = :v',
      ExpressionAttributeValues: {
        ':v': JSON.stringify(session)
      }
    };
    return this._db.update(params)
      .catch((err) => console.log(err));
  }

  clearSession(key) {
    let params = {
      Key: {
        SessionKey: key
      }
    };
    return this._db.delete(params)
      .catch((err) => console.log(err));
  }

  middleware() {
    return (ctx, next) => {
      const key = this.options.getSessionKey(ctx)
      if (!key) {
        return next();
      }
      return this.getSession(key)
        .then((session) => {
          Object.defineProperty(ctx, this.options.property, {
            get: function () {
              return session
            },
            set: function (newValue) {
              session = Object.assign({}, newValue)
            }
          })
          return next().then(() => this.saveSession(key, session))
        }).catch((err) => console.log(err));
    }
  }
}

module.exports = DynamoDBSession;