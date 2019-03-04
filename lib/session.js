const DynamoDBHelper = require('./dynamodb-helper');

class DynamoDBSession {
  constructor(options) {
    this.options = Object.assign({
      property: 'session',
      ttl: -1, // minutes, -1 for never expired
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
        return data.Item.SessionValue;
      })
      .catch((err) => console.log(err));
  }

  saveSession(key, session) {
    if (!session || Object.keys(session).length === 0) {
      return this.clearSession(key)
    }
    let params = {
      ExpressionAttributeNames: {
        "#SV": "SessionValue"
      },
      Key: {
        SessionKey: key
      },
      UpdateExpression: 'set #SV = :v',
      ExpressionAttributeValues: {
        ':v': session
      }
    };
    if (this.options.ttl > -1) {
      params.ExpressionAttributeNames = {
        "#SV": "SessionValue",
        "#T": "ttl"
      };
      params.UpdateExpression = 'set #SV = :v, #T = :t'
      params.ExpressionAttributeValues = {
        ':v': session,
        ':t': Math.floor(Date.now() / 1000) + this.options.ttl * 60
      }
    }
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