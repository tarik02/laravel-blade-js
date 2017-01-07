'use strict';

let extend = require('extend');
let mkdirp = require('mkdirp');
let md5 = require('md5');
let fs = require('fs');
let ViewNotFoundError = require('./ViewNotFoundError');
let escape = require('js-string-escape');
var escapeHTML = require('escape-html');

module.exports = class Renderer {
	constructor() {
		this._viewId = 0;

		this._config = {
			views: __dirname + '/views',
			cacheEnabled: true,
			cache: __dirname + '/cache',

			production: false
		};


		this._functions = {

		};

		this._variables = {

		};

		this._cachedViewsData = {

		};


		// Control blocks
		this.registerFunction('if', {
			callback: parameters => `if (${parameters}) {`,

			output: false,
			escape: false
		});

		this.registerFunction('else', {
			callback: parameters => `} else {`,

			output: false,
			escape: false
		});

		this.registerFunction('elseif', {
			callback: parameters => `} else if (${parameters}) {`,

			output: false,
			escape: false
		});

		this.registerFunction('endif', {
			callback: parameters => `}`,

			output: false,
			escape: false
		});

		this.registerFunction('unless', {
			callback: parameters => `if (!(${parameters})) {`,

			output: false,
			escape: false
		});

		this.registerFunction('endunless', {
			callback: parameters => `}`,

			output: false,
			escape: false
		});


		// Loops
		this.registerFunction('for', {
			callback: parameters => `for (${parameters}) {`,

			output: false,
			escape: false
		});

		this.registerFunction('endfor', {
			callback: parameters => `}`,

			output: false,
			escape: false
		});

		this.registerFunction('foreach', {
			callback: parameters => {
				let variables = parameters.match(/([$A-Za-z][$A-Za-z]*)/g).filter(name => name !== 'as');

				if (variables.length === 2) {
					variables.splice(1, 0, '__unused');
				}

				let array = variables[0];
				let key = variables[1];
				let value = variables[2];

				return `{ let $__items = $__utils.forEach(${array});\nfor (let $__i = 0, $__entry = $__items[$__i] || [], ${key} = $__entry[0], ${value} = $__entry[1]; $__i < $__items.length; ++$__i, $__entry = $__items[$__i] || [], ${key} = $__entry[0], ${value} = $__entry[1]) {`;
			},

			output: false,
			escape: false
		});

		this.registerFunction('endforeach', {
			callback: parameters => `} }`,

			output: false,
			escape: false
		});

		this.registerFunction('forelse', {
			callback: parameters => {
				let variables = parameters.match(/([$A-Za-z][$A-Za-z]*)/g).filter(name => name !== 'as');

				if (variables.length === 2) {
					variables.splice(1, 0, '__unused');
				}

				let array = variables[0];
				let key = variables[1];
				let value = variables[2];

				return `{ let $__items = $__utils.forEach(${array});\nfor (let $__i = 0, $__entry = $__items[$__i] || [], ${key} = $__entry[0], ${value} = $__entry[1]; $__i < $__items.length; ++$__i, $__entry = $__items[$__i] || [], ${key} = $__entry[0], ${value} = $__entry[1]) {`;
			},

			output: false,
			escape: false
		});

		this.registerFunction('empty', {
			callback: parameters => `} if ($__items.length === 0) {`,

			output: false,
			escape: false
		});

		this.registerFunction('endforelse', {
			callback: parameters => `} }\n`,

			output: false,
			escape: false
		});

		this.registerFunction('while', {
			callback: parameters => `while (${parameters}) {`,

			output: false,
			escape: false
		});

		this.registerFunction('endwhile', {
			callback: parameters => `}`,

			output: false,
			escape: false
		});

		this.registerFunction('continue', {
			callback: parameters => {
				if (parameters === '') {
					return 'continue';
				}

				return `if (${parameters}) {\ncontinue;\n}`;
			},

			output: false,
			escape: false
		});

		this.registerFunction('break', {
			callback: parameters => {
				if (parameters === '') {
					return 'break';
				}

				return `if (${parameters}) {\nbreak;\n}`;
			},

			output: false,
			escape: false
		});


		// Stack
		this.registerFunction('push', {
			callback: parameters => `$__utils.push(${parameters}, (function() { let $__result = '';`,

			output: false,
			escape: false
		});

		this.registerFunction('endpush', {
			callback: parameters => `return $__result;})());`,

			output: false,
			escape: false
		});

		this.registerFunction('stack', {
			callback: parameters => `$__utils.stack(${parameters});`,

			output: true,
			escape: false
		});


		// Sections, extending
		this.registerFunction('extends', {
			callback: parameters => `$__utils.extends($__viewObject, ${parameters});`,

			output: false,
			escape: false
		});

		this.registerFunction('yield', {
			callback: parameters => this._utils.yield(parameters),

			output: true,
			escape: false
		});

		this.registerFunction('section', {
			callback: parameters => {
				// $__utils.section(${((parameters === '') ? ('') : (`${parameters}, `))}(function() { let $__result = '';

				let parametersArray = parameters.split(',').map(param => param.trim());

				if (parametersArray.length === 2) {
					return `$__utils.section($__viewObject.sections, ${parameters});`;
				}

				return `$__utils.section($__viewObject.sections, ${parameters}, function($__parent) { let $__result = ''`;
			},

			output: true,
			escape: false
		});

		this.registerFunction('endsection', {
			callback: parameters => `return $__result;});`,

			output: false,
			escape: false
		});

		this.registerFunction('overwrite', {
			callback: parameters => `return $__result;});`,

			output: false,
			escape: false
		});

		this.registerFunction('show', {
			callback: parameters => `return $__result;}, true);`,

			output: false,
			escape: false
		});

		this.registerFunction('parent', {
			callback: parameters => `$__parent`,

			output: true,
			escape: false
		});


		// Other
		this.registerFunction('include', {
			callback: parameters => `$__utils.include($__viewObject, ${parameters});`,

			output: true,
			escape: false
		});

		this.registerFunction('each', {
			callback: parameters => `$__utils.each($__viewObject, ${parameters});`,

			output: true,
			escape: false
		});



		this._utils = {
			_stacks: {  },
			_views: [  ],


			escapeHTML: escapeHTML,

			forEach: array => {
				let result = [  ];

				if (array instanceof Array) {
					array.forEach((value, key) => result.push([ key, value ]));
				} else {
					for (let key in array) {
						if (array.hasOwnProperty(key)) {
							let value = array[key];
							result.push([ key, value ]);
						}
					}
				}

				return result;
			},
			
			include: (parent, view, parameters = null) => {
				return this.render(view, parameters, parent.settings);
			},

			each: (parent, view, array, variable, empty = null) => {
				let forEached = this._utils.forEach(array);

				if (forEached.length === 0)
				{
					if (empty !== null) {
						return this._utils.include(parent, empty);
					}

					return '';
				} else {
					return forEached.map(item => {
						let parameters = {  };
						parameters[variable] = item;
						return this._utils.include(parent, view, parameters);
					}).join('\n');
				}
			},

			push: (name, data) => {
				let stacks = this._utils._stacks;

				if (stacks[name]) {
					stacks[name] += data;
				} else {
					stacks[name] = data;
				}
			},

			stack: name => {
				let stacks = this._utils._stacks;

				return (stacks[name]) || ('');
			},

			viewBegin: viewId => {
				this._utils._views.push({
					parent: null
				});

				return '';
			},

			viewEnd: (parent, viewId, result) => {
				let viewData = this._utils._getCurrentViewData();

				if (viewData.parent) {
					result = this.render(viewData.parent, viewData.parentParameters, parent.settings, viewData.parentView);
				}

				this._utils._views.pop();

				return result;
			},

			extends: (parentView, parent, parameters = {}) => {
				this._utils._getCurrentViewData().parentView = parentView;
				this._utils._getCurrentViewData().parent = parent;
				this._utils._getCurrentViewData().parentParameters = parameters;
			},

			yield: name => {
				return `($__viewObject.parentView.sections[${name}] || (() => ''))()`;
			},

			section: (sections, name, data, show = false) => {
				if (show) {
					return this._utils._getPrevViewData().sections[name].data(data());
				} else {
					sections[name] = (typeof data === 'function') ? (data) : (() => data);
				}

				return '';
			},

			_getCurrentViewData: () => this._utils._views[this._utils._views.length - 1],
			_getPrevViewData: () => this._utils._views[this._utils._views.length - 2]
		};
	}

	/**
	 * @param {Object} config
	 * @param {String}  [config.views] -        Input views folder, default is `__dirname/views`.
	 * @param {Boolean} [config.cacheEnabled] - Enable or disable compiled view cache, default is true.
	 * @param {String}  [config.cache] -        Compiled views cache folder, default is `__dirname/cache`.
	 * @param {Boolean} [config.production] -   Minimizes filesystem interaction, speed-up all views rendering, default is false.
	 *
	 * @return {Renderer}
	 */
	set(config) {
		extend(this._config, config);

		mkdirp(config.views);
		mkdirp(config.cache);

		return this;
	}

	/**
	 * Adds blade function(start at @).
	 *
	 * @param {String}   name -            The function name
	 * @param {Object}   object -          The function object
	 * @param {Function} object.callback - The function callback(parameters). Must return expression will be instead of blade function.
	 * @param {Boolean}  [object.output] - If true, the function has an output. Default is false.
	 * @param {Boolean}  [object.escape] - If true, output of the function will be escaped(html). Default is false.
	 */
	registerFunction(name, object) {
		object = extend({
			callback: () => '',
			output: false,
			escape: false
		}, object);

		this._functions[name] = object;
	}

	/**
	 * Adds a shared variable for all views.
	 *
	 * @param {String} name  - Name of shared variable
	 * @param          value - Value of shared variable
	 */
	registerVariable(name, value) {
		this._variables[name] = value;
	}

	/**
	 * @param {String} view         - View name to render
	 * @param {Object} [properties] - Properties can be used inside view
	 * @param {Object} [settings]   - Settings can be used in custom functions
	 *
	 * @return {String}
	 */
	render(view, properties = {}, settings = {}, parentView = {}) {
		try {
			let cachedData = this._cachedViewsData[view];
			let viewId = this._viewId++;

			let viewObject = {
				view: view,
				parentView: parentView,
				properties: properties,
				settings: settings,
				sections: { __proto__: parentView.sections }
			};

			if ((cachedData) && (this._config.production)) {
				return this._renderView(view, cachedData.func, properties, viewId, viewObject);
			}


			let viewName = this._config.views + '/' + view.replace('.', '/') + '.bjs';
			//let cacheName = this._config.cache + '/' + md5(viewName);
			let cacheName = this._config.cache + '/' + view + '.cache.js';

			if (!fs.existsSync(viewName)) {
				throw new ViewNotFoundError(view);
			}


			let viewTime = fs.statSync(viewName).mtime.getTime();

			if ((this._config.cacheEnabled) && (fs.existsSync(cacheName))) {
				let cacheTime = fs.statSync(cacheName).mtime.getTime();

				if (viewTime < cacheTime) {
					if ((cachedData) && (cacheTime < cachedData.time)) {
						return this._renderView(view, cachedData.func, properties, viewId, viewObject);
					}

					return this._renderNewView(view, fs.readFileSync(cacheName).toString(), properties, viewId, viewObject);
				}
			}

			let viewContent = fs.readFileSync(viewName).toString();
			let renderedContent = this._compile(viewContent).build();

			fs.writeFileSync(cacheName, renderedContent);

			return this._renderNewView(view, renderedContent, properties, viewId, viewObject);
		} catch (error) {
			console.error(`Failed to render view ${view}`);

			throw error;
		}
	}

	/**
	 * @param {String} view         - View name to render
	 * @param {Object} [properties] - Properties can be used inside view
	 * @param {Object} [settings]   - Settings can be used in custom functions
	 *
	 * @return {Promise}
	 */
	renderAsync(view, properties = {}, settings = {}) {
		return new Promise((resolve, reject) => {
			try {
				resolve(this.render(view, properties, settings));
			} catch (e) {
				reject(e);
			}
		});
	}

	_renderView(view, viewFunc, properties, viewId, viewObject, save = false) {
		if (save) {
			this._cachedViewsData[view] = {
				time: (new Date()).getTime(),
				func: viewFunc
			};
		}

		return viewFunc.call(properties, this._utils, viewId, this._variables, viewObject);
	}

	_renderNewView(view, code, properties, viewId, viewObject) {
		return this._renderView(view, eval.call(properties, code), properties, viewId, viewObject, true);
	}

	_compile(code) {
		let builder = {
			_text: '',

			append: function(text) {
				this._text += text;
			},

			build: function() {
				return this._text;
			}
		};

		builder.append(`(function($__utils, $__viewId, $__sharedVariables, $__viewObject) {
	for (let key in this) {
		if (this.hasOwnProperty(key)) {
			if (typeof this[key] === 'function') {
				eval(\`var \${key} = this[key].bind(null, $__viewObject);\`);
			} else {
				eval(\`var \${key} = this[key];\`);
			}
		}
	}\n
	
	for (let key in $__sharedVariables) {
		if ($__sharedVariables.hasOwnProperty(key)) {
			if (typeof $__sharedVariables[key] === 'function') {
				eval(\`var \${key} = $__sharedVariables[key].bind(null, $__viewObject);\`);
			} else {
				eval(\`var \${key} = $__sharedVariables[key];\`);
			}
		}
	}\n`);

		builder.append('var $__result = $__utils.viewBegin($__viewId);\n');


		this._compileCode(code, builder);


		builder.append('return $__utils.viewEnd($__viewObject, $__viewId, $__result);\n');
		builder.append('})\n');

		return builder;
	}

	_compileCode(code, builder) {
		const STATE_DEFAULT = 0;
		const STATE_ENCODED_DATA = 1;
		const STATE_UNENCODED_DATA = 2;
		const STATE_COMMENT = 3;
		const STATE_FUNCTION = 4;
		const STATE_FUNCTION_PARAMS = 5;

		let state = STATE_DEFAULT;
		let defaultStart = 0;
		let encodedDataStart = 0;
		let unencodedDataStart = 0;

		let functionStart = 0;
		let functionName = '';

		let functionParamsStart = 0;
		let functionParamsBraceCount = 0;

		for (let i = 0; i < code.length; ++i) {
			let char = code[i];
			let char1 = code[i + 1];
			let char2 = code[i + 2];
			let char3 = code[i + 3];

			switch (state) {
			case STATE_DEFAULT:
				if (defaultStart === null) {
					defaultStart = i;
				}

				if (char === '{') {
					if (char1 === '{') {
						if ((char2 === '-') && (char2 === '-')) {
							state = STATE_COMMENT;
						} else {
							state = STATE_ENCODED_DATA;
							encodedDataStart = i + 2;
						}
					} else {
						if ((char1 === '!') && (char2 === '!')) {
							state = STATE_UNENCODED_DATA;
							unencodedDataStart = i + 3;
						}
					}
				}

				if (state === STATE_DEFAULT) {
					if (char === '@') {
						state = STATE_FUNCTION;
						functionStart = i + 1;
						functionName = null;
					}
				}

				if (state !== STATE_DEFAULT) {
					builder.append('$__result += ');
					builder.append(this._escape(code.substring(defaultStart, i)));
					builder.append(';\n');

					defaultStart = null;
				}
				break;
			case STATE_ENCODED_DATA:
				if ((char === '}') && (char1 === '}')) {
					builder.append('$__result += $__utils.escapeHTML(');
					builder.append(code.substring(encodedDataStart, i));
					builder.append(');\n');

					state = STATE_DEFAULT;
					++i;
				}
				break;
			case STATE_UNENCODED_DATA:
				if ((char === '!') && (char1 === '!') && (char2 === '}')) {
					builder.append('$__result += (');
					builder.append(code.substring(unencodedDataStart, i));
					builder.append(');\n');

					state = STATE_DEFAULT;
					i += 2;
				}
				break;
			case STATE_COMMENT:
				if ((char === '-') && (char1 === '-') && (char2 === '}') && (char3 === '}')) {
					state = STATE_DEFAULT;
					i += 3;
				}
				break;
			case STATE_FUNCTION:
				if (functionStart === i) {
					if (!char.match(/[a-zA-Z]/)) {
						builder.append('$__result += \'@\';\n');
						state = STATE_DEFAULT;
					}
				} else if (char.match(/[a-zA-Z0-9]/)) {

				} else if (char.match(/[ \t]/)) {
					if (functionName === null) {
						functionName = code.substring(functionStart, i).trim();
					}
				} else if (char === '(') {
					if (functionName === null) {
						functionName = code.substring(functionStart, i).trim();
					}

					state = STATE_FUNCTION_PARAMS;
					functionParamsStart = i + 1;
					functionParamsBraceCount = 1;
				} else {
					if (functionName === null) {
						functionName = code.substring(functionStart, i).trim();
					}

					builder.append(this._makeFunction(functionName));

					state = STATE_DEFAULT;
				}
				break;
			case STATE_FUNCTION_PARAMS:
				switch (char) {
				case '(':
					++functionParamsBraceCount;
					break;
				case ')':
					if (--functionParamsBraceCount === 0) {
						builder.append(this._makeFunction(functionName, code.substring(functionParamsStart, i)));

						state = STATE_DEFAULT;
					}
					break;
				}
				break;
			}
		}

		switch (state) {
		case STATE_DEFAULT:
			if (defaultStart !== null) {
				builder.append('$__result += ');
				builder.append(this._escape(code.substring(defaultStart)));
				builder.append(';');
			}
			break;
		case STATE_FUNCTION:
			if (functionName === null) {
				functionName = code.substring(functionStart).trim();
				builder.append(this._makeFunction(functionName));
			}
			break;
		}
	}

	_escape(string) {
		return `'${escape(string)}'`;
	}

	_makeFunction(name, parameters = '') {
		if (this._functions.hasOwnProperty(name)) {
			let functionData = this._functions[name];
			let result = functionData.callback(parameters);

			if (functionData.output) {
				if (functionData.escape) {
					result = `$__result += $__utils.escapeHTML(${result});`;
				} else {
					result = `$__result += ${result};`;
				}
			}

			return result + '\n';
		}

		return '';
	}
};