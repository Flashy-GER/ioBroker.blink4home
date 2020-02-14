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
		this.on('stateChange', this.onStateChange.bind(this));
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