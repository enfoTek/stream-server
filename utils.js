/*
    ***** BEGIN LICENSE BLOCK *****
    
    Copyright © 2015 Zotero
                     https://www.zotero.org
    
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.
    
    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    
    ***** END LICENSE BLOCK *****
*/

"use strict";

var config = require('config');
var strftime = require('strftime');

module.exports = function () {
	//
	// Private functions
	//
	
	function HTTPError (code, message) {
		this.code = code;
		this.message = message || "";
	}
	HTTPError.prototype = new Error; // e instanceof Error == true
	
	
	//
	// Public methods
	//
	return {
		log: function (msg, connectionOrRequest) {
			var date = "[" + strftime("%d/%b/%Y:%H:%M:%S %z") + "] ";
			
			if (connectionOrRequest) {
				// Request
				if (connectionOrRequest.socket) {
					var addr = this.getIPAddressFromRequest(connectionOrRequest);
				}
				// Connection (address stored in connections.registerConnection())
				else if (connectionOrRequest.remoteAddress) {
					var addr = connectionOrRequest.remoteAddress;
				}
			}
			
			if (addr) {
				console.log(date + "[" + addr + "] " + msg);
			}
			else {
				console.log(date + msg);
			}
		},
		
		debug: function (msg, connectionOrRequest) {
			if (config.get('debug')) {
				this.log(msg, connectionOrRequest);
			}
		},
		
		end: function (req, res, code, msg) {
			if (!code) {
				utils.log("WARNING: Response code not provided to utils.end()")
				code = 500;
			}
			
			var logMessage = (msg instanceof Error) ? msg.stack : msg;
			this.log('"' + req.method + " " + req.url + '" ' + code + " - " + logMessage, req);
			
			res.writeHead(code, { "Content-Type": 'text/plain' });
			
			// For 500 errors, hide real error message unless this is a dev site
			if (this.isServerError(code) && (!config.has('dev') || !config.get('dev'))) {
				msg = "Error";
			}
			res.end(msg);
		},
		
		getIPAddressFromRequest: function (request) {
			try {
				var addr = request.socket.clientAddress || request.socket.remoteAddress;
				
				/*
				// If from localhost or local network, use X-Forwarded-For header if available
				if (request.headers
						&& request.headers['x-forwarded-for']
						// TODO: pref
						&& (addr == '127.0.0.1' || addr.startsWith("10.") || addr.startsWith("192.168."))) {
					addr = request.headers['x-forwarded-for'].split(' ')[0];
				}*/
				
				return addr;
			}
			catch (e) {
				utils.log(e);
				return "";
			}
		},
		
		plural: function (str, num) {
			return str + (num != 1 ? 's' : '');
		},
		
		isClientError: function (code) {
			return code >= 400 && code < 500;
		},
		
		isServerError: function (code) {
			return code >= 500 && code < 600;
		},
		
		HTTPError: HTTPError
	};
}()
