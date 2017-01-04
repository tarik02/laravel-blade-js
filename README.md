# laravel-blade-js
### API

#### Setup
To start work with blade, you must to create blade `Renderer`:
```
	const BladeRenderer = require('laravel-blade-js').Renderer;
```
And create new instance of `BladeRenderer`:
```
	let renderer = new BladeRenderer();
```
You can set renderer config:
```
	/**
    	 * @param {Object}  config
    	 * @param {String}  [config.views] -        Input views folder, default is `__dirname/views`.
    	 * @param {Boolean} [config.cacheEnabled] - Enable or disable compiled view cache, default is true.
    	 * @param {String}  [config.cache] -        Compiled views cache folder, default is `__dirname/cache`.
    	 * @param {Boolean} [config.production] -   Minimizes filesystem interaction, speed-up all views rendering, default is false.
    	 *
    	 * @return {Renderer}
    	 */
	BladeRenderer.set(config);
```

#### View rendering
To render your view('*.bjs'):
```
	/**
    	 * @param {String} view         - View name to render
    	 * @param {Object} [properties] - Properties can be used inside view
    	 * @param {Object} [settings]   - Settings can be used in custom functions
    	 *
    	 * @return {String}
    	 */
        Renderer.render(view, properties = {}, settings = {});
```

##### Example
```
    bladeRenderer.render('index', {
    	'content': 'Hello world'
    }, {
        lang: 'ru' // Give language for custom variables(functions)
    });
```

Or async:
```
	/**
    	 * @param {String} view         - View name to render
    	 * @param {Object} [properties] - Properties can be used inside view
    	 * @param {Object} [settings]   - Settings can be used in custom functions
    	 *
    	 * @return {Promise}
    	 */
    	Renderer.renderAsync(view, properties = {}, settings = {});
```

#### Custom functions and variables
Add custom blade function:
```
	/**
    	 * Adds blade function(start at @).
    	 *
    	 * @param {String}   name -            The function name
    	 * @param {Object}   object -          The function object
    	 * @param {Function} object.callback - The function callback(parameters). Must return expression will be instead of blade function.
    	 * @param {Boolean}  [object.output] - If true, this function has an output. Default is false.
    	 * @param {Boolean}  [object.escape] - If true, output of the function will be escaped(html). Default is false.
    	 */
        Renderer.registerFunction(name, object);
```

##### Example
```
    bladeRenderer.registerFunction('lang', {
        callback: parameters => `trans(${parameters})`, // Will compile blade '@lang(...)' to javascript 'trans(...)'

        output: true, // True if function adds anything to content
        escape: true // Will escape all output
    });
```

Add custom blade variable(function):
```
    /**
     * Adds a shared variable for all views.
     *
     * @param {String} name  - Name of shared variable
     * @param          value - Value of shared variable
     */
    Renderer.registerVariable(name, value);
```

##### Example
```
    /*
     * {Object} view is object that contains {properties, settings}.
     * Warning! view.properties can be empty in nested view.
     * If you want to use something like this even in nested view, use
     * view.settings.
     */
    bladeRenderer.registerVariable('trans', (view, key) => {
    	let entry = Language.get(view.settings.lang, key);
    	
    	return entry;
    });
```

### Speed
Testing view:
 - 1 extend;
 - 6 includes;
   * 1 extend;
   * 1 section;
 - 2 sections.

Results:
 - First rendering: 251ms;
 - Second rendering: 23ms;
 - All next is 5-10ms;
 - If `production` is `true` then 0.5-5ms.