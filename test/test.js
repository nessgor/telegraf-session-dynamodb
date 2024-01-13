const expect = require('chai').expect;
const { Telegraf } = require('telegraf');
const { message } = require("telegraf/filters");

const DynamoDBSession = require('../lib/session');

const mockBotId = 'R2D2'; //change to live test telegram token

describe('DynamoDB session for Telegraf', function () {
	it('should be defined', (done) => {
		const app = new Telegraf(mockBotId);
		app.telegram.callApi = () => {
			return {}
		}
		const dynamoDBSession = new DynamoDBSession();
		app.on(message("text"), dynamoDBSession.middleware(), (ctx) => {
			expect(ctx).to.have.property('session');
			expect(ctx.session).to.be.an('object');
			done();
		});
		app.handleUpdate({
			message: {
				chat: {
					id: 1
				},
				from: {
					id: 1
				},
				text: 'hey'
			}
		});
	});

	it('should retrieve and save session', (done) => {
		const app = new Telegraf(mockBotId);
		app.telegram.callApi = () => {
			return {}
		}
		const dynamoDBSession = new DynamoDBSession();
		const key = '1:1';
		dynamoDBSession.getSession(key)
			.then((session) => {
				expect(session).to.be.an('object');
				session.foo = 42;
				session.bar = {
					foo: "bar"
				};
				return dynamoDBSession.saveSession(key, session);
			})
			.then(() => {
				return dynamoDBSession.getSession(key);
			})
			.then((session) => {
				expect(session).to.be.an('object');
				expect(session).to.deep.equal({
					foo: 42,
					bar: {
						foo: "bar"
					}
				});
				done();
			});
	});

	it('should handle existing session', (done) => {
		const app = new Telegraf(mockBotId);
		app.telegram.callApi = () => {
			return {}
		}
		const dynamoDBSession = new DynamoDBSession();
		app.on(message("text"),
			dynamoDBSession.middleware(),
			(ctx) => {
				expect(ctx).to.have.property('session');
				expect(ctx.session).to.be.an('object');
				expect(ctx.session).to.deep.equal({
					foo: 42,
					bar: {
						foo: "bar"
					}
				});
				done();
			});
		app.handleUpdate({
			message: {
				chat: {
					id: 1
				},
				from: {
					id: 1
				},
				text: 'hey'
			}
		});
	});

	it('should handle not existing session', (done) => {
		const app = new Telegraf(mockBotId);
		app.telegram.callApi = () => {
			return {}
		}
		const dynamoDBSession = new DynamoDBSession();
		app.on(message("text"),
			dynamoDBSession.middleware(),
			(ctx) => {
				expect(ctx).to.have.property('session');
				expect(ctx.session).to.be.an('object');
				expect(ctx.session).to.not.have.any.keys('foo', 'bar');
				done();
			});
		app.handleUpdate({
			message: {
				chat: {
					id: 1
				},
				from: {
					id: 999
				},
				text: 'hey'
			}
		});
	});

	it('should handle session reset', (done) => {
		const app = new Telegraf(mockBotId);
		app.telegram.callApi = () => {
			return {}
		}
		const dynamoDBSession = new DynamoDBSession();
		app.on(message("text"),
			dynamoDBSession.middleware(),
			(ctx) => {
				ctx.session = null
				expect(ctx).to.have.property('session');
				expect(ctx.session).to.be.an('object');
				expect(ctx.session).to.not.have.any.keys('foo', 'bar');
				done();
			})
		app.handleUpdate({
			message: {
				chat: {
					id: 1
				},
				from: {
					id: 1
				},
				text: 'hey'
			}
		});
	});
});