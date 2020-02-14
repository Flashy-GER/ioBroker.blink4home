'use strict';

/*
 * Created with @iobroker/create-adapter v1.21.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load your modules here, e.g.:
const blinkapi = require('node-blink-security');

class Blink4home extends utils.Adapter {

	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: 'blink4home',
		});
		this.on('ready', this.onAdapterStart.bind(this));
		//this.on('stateChange', this.onStateChange.bind(this));
		this.on('unload', this.onAdapterStop.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onAdapterStart() {
		// Initialize your adapter here

		// this.config: User defined configurations
		this.log.debug('config Username: ' + this.config.username);
		this.log.debug('config Password: ' + '*****************');
		this.log.debug('config Interval: ' + this.config.interval);
		this._authtoken = '';

		//initale Blink authentification
		this.blink = new blinkapi(this.config.username, this.config.password);

		// all states changes inside the adapters namespace are subscribed
		this.pollStatusFromBlinkServers(this, this.config.interval);
		this.subscribeStates('*');
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onAdapterStop(callback) {
		try {
			this.log.info('cleaned everything up...');
			callback();
		} catch (e) {
			callback();
		}
	}

	createStateObjects(summary){
		this.log.debug('start creating objects');
		const promises = [];
		Object.entries(summary.network).forEach( (networkAttr) => {
			const key = networkAttr[0];
			const val = networkAttr[1];
			this.log.debug('creating network object '+summary.network.name+'.'+key);
			promises.push(this.setObjectNotExistsAsync(summary.network.name+'.'+key, {
				type: 'state',
				common: {
					name: key,
					type: typeof val,
					role: 'indicator',
					read: true,
					write: false
				},
				native: {
					id: summary.network.name+'.'+key
				}
			}));
		});

		summary.devices.forEach( (device) => {
			Object.entries(device).forEach( (deviceAttr) => {
				const key = deviceAttr[0];
				const val = deviceAttr[1];
				promises.push(this.setObjectNotExistsAsync(summary.network.name+'.'+device.name+'.'+key, {
					type: 'state',
					common: {
						name: key,
						type: typeof val,
						role: 'indicator',
						read: true,
						write: false
					},
					native: {
						id: summary.network.name+'.'+device.name+'.'+key
					}
				}));
			});
		});
		return promises;
	}
	
	updateStatesFromSummary(summary){
		Object.entries(summary.network).forEach( (networkAttr) => {
			const key = networkAttr[0];
			const val = networkAttr[1];
			this.setState(summary.network.name+'.'+key, val, true);
		});
		summary.devices.forEach( (device) => {
			Object.entries(device).forEach( (deviceAttr) => {
				const key = deviceAttr[0];
				const val = deviceAttr[1];
				this.setState(summary.network.name+'.'+device.name+'.'+key, val, true);
			});
		});
	}
	
	pollStatusFromBlinkServers(scope, intsecs){
		scope.log.debug('start polling from server. interval ' + intsecs + ' seconds.');
		scope.blink.setupSystem().then(() => {
			scope.log.debug('connection set up');
			scope.blink.getSummary().then((summary) => {
				scope.log.debug('processing summary');
				const promises = scope.createStateObjects(summary);
				Promise.all(promises).then(() => {
					scope.log.debug('update states from summary');
					scope.updateStatesFromSummary(summary);
					scope.log.debug('updated states, setting timer in '+intsecs+' seconds');
					setTimeout(scope.pollStatusFromBlinkServers, intsecs * 1000, scope, intsecs);
					scope.log.debug('timer set, all is done');
				}).catch((err) => {
					scope.log.error('error: ' + err);
					setTimeout(scope.pollStatusFromBlinkServers, intsecs * 1000, scope, intsecs);
				});
			},function(error){
				scope.log.error(error);
				setTimeout(scope.pollStatusFromBlinkServers, intsecs * 1000, scope, intsecs);
			});
		});
	}		
}

// @ts-ignore parent is a valid property on module
if (module.parent) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Blink4home(options);
} else {
	// otherwise start the instance directly
	new Blink4home();
}