/*!
* Crafty v0.4.4
* http://craftyjs.com
*
* Copyright 2010, Louis Stowasser
* Dual licensed under the MIT or GPL licenses.
*/ (function (window, undefined) {

	/**@
* #Crafty
* @category Core
* Select a set of or single entities by components or an entity's ID.
*
* Crafty uses syntax similar to jQuery by having a selector engine to select entities by their components.
*
* @example
* ~~~
*    Crafty("MyComponent")
*    Crafty("Hello 2D Component")
*    Crafty("Hello, 2D, Component")
* ~~~
* The first selector will return all entities that has the component `MyComponent`. The second will return all entities that has `Hello` and `2D` and `Component` whereas the last will return all entities that has at least one of those components (or).
* ~~~
*   Crafty(1)
* ~~~
* Passing an integer will select the entity with that `ID`.
*
* Finding out the `ID` of an entity can be done by returning the property `0`.
* ~~~
*    var ent = Crafty.e("2D");
*    ent[0]; //ID
* ~~~
*/
	var Crafty = function (selector) {
		return new Crafty.fn.init(selector);
	},

	GUID = 1, //GUID for entity IDs
	FPS = 50,
	frame = 1,

	components = {}, //map of components and their functions
	entities = {}, //map of entities and their data
	handlers = {}, //global event handlers
	onloads = [], //temporary storage of onload handlers
	tick,
	tickID,

	noSetter,

	loops = 0,
	skipTicks = 1000 / FPS,
	nextGameTick = (new Date).getTime(),

	slice = Array.prototype.slice,
	rlist = /\s*,\s*/,
	rspace = /\s+/;

	/**@
* #Crafty Core
* @category Core
* @trigger NewComponent - when a new component is added to the entity - String - Component
* @trigger RemoveComponent - when a component is removed from the entity - String - Component
* @trigger Remove - when the entity is removed by calling .destroy()
* Set of methods added to every single entity.
*/
	Crafty.fn = Crafty.prototype = {

		init: function (selector) {
			//select entities by component
			if (typeof selector === "string") {
				var elem = 0, //index elements
				e, //entity forEach
				current,
				and = false, //flags for multiple
				or = false,
				del,
                comps,
                score,
                i, l;

				if (selector === '*') {
					for (e in entities) {
						this[+e] = entities[e];
						elem++;
					}
					this.length = elem;
					return this;
				}

				//multiple components OR
				if (selector.indexOf(',') !== -1) {
					or = true;
					del = rlist;
					//deal with multiple components AND
				} else if (selector.indexOf(' ') !== -1) {
					and = true;
					del = rspace;
				}

				//loop over entities
				for (e in entities) {
					if (!entities.hasOwnProperty(e)) continue; //skip
					current = entities[e];

					if (and || or) { //multiple components
						comps = selector.split(del);
						i = 0;
						l = comps.length;
						score = 0;

						for (; i < l; i++) //loop over components
							if (current.__c[comps[i]]) score++; //if component exists add to score

						//if anded comps and has all OR ored comps and at least 1
						if (and && score === l || or && score > 0) this[elem++] = +e;

					} else if (current.__c[selector]) this[elem++] = +e; //convert to int
				}

				//extend all common components
				if (elem > 0 && !and && !or) this.extend(components[selector]);
				if (comps && and) for (i = 0; i < l; i++) this.extend(components[comps[i]]);

				this.length = elem; //length is the last index (already incremented)

			} else { //Select a specific entity

				if (!selector) { //nothin passed creates God entity
					selector = 0;
					if (!(selector in entities)) entities[selector] = this;
				}

				//if not exists, return undefined
				if (!(selector in entities)) {
					this.length = 0;
					return this;
				}

				this[0] = selector;
				this.length = 1;

				//update from the cache
				if (!this.__c) this.__c = {};

				//update to the cache if NULL
				if (!entities[selector]) entities[selector] = this;
				return entities[selector]; //return the cached selector
			}

			return this;
		},

		/**@
	* #.addComponent
	* @comp Crafty Core
	* @sign public this .addComponent(String componentList)
	* @param componentList - A string of components to add seperated by a comma `,`
	* @sign public this .addComponent(String Component1[, .., String ComponentN])
	* @param Component# - Component ID to add.
	* Adds a component to the selected entities or entity.
	*
	* Components are used to extend the functionality of entities.
	* This means it will copy properties and assign methods to
	* augment the functionality of the entity.
	*
	* There are multiple methods of adding components. Passing a
	* string with a list of component names or passing multiple
	* arguments with the component names.
	*
	* @example
	* ~~~
	* this.addComponent("2D, Canvas");
	* this.addComponent("2D", "Canvas");
	* ~~~
	*/
		addComponent: function (id) {
			var uninit = [], c = 0, ul, //array of components to init
            i = 0, l, comps;

			//add multiple arguments
			if (arguments.length > 1) {
				l = arguments.length;
				for (; i < l; i++) {
					this.__c[arguments[i]] = true;
					uninit.push(arguments[i]);
				}
				//split components if contains comma
			} else if (id.indexOf(',') !== -1) {
				comps = id.split(rlist);
				l = comps.length;
				for (; i < l; i++) {
					this.__c[comps[i]] = true;
					uninit.push(comps[i]);
				}
				//single component passed
			} else {
				this.__c[id] = true;
				uninit.push(id);
			}

			//extend the components
			ul = uninit.length;
			for (; c < ul; c++) {
				comp = components[uninit[c]];
				this.extend(comp);

				//if constructor, call it
				if (comp && "init" in comp) {
					comp.init.call(this);
				}
			}

			this.trigger("NewComponent", ul);
			return this;
		},

		/**@
	* #.requires
	* @comp Crafty Core
	* @sign public this .requires(String componentList)
	* @param componentList - List of components that must be added
	* Makes sure the entity has the components listed. If the entity does not
	* have the component, it will add it.
	* @see .addComponent
	*/
		requires: function (list) {
			var comps = list.split(rlist),
			i = 0, l = comps.length,
			comp;

			//loop over the list of components and add if needed
			for (; i < l; ++i) {
				comp = comps[i];
				if (!this.has(comp)) this.addComponent(comp);
			}

			return this;
		},

		/**@
	* #.removeComponent
	* @comp Crafty Core
	* @sign public this .removeComponent(String Component[, soft])
	* @param component - Component to remove
	* @param soft - Whether to soft remove it (defaults to `true`)
	* Removes a component from an entity. A soft remove will only
	* refrain `.has()` from returning true. Hard will remove all
	* associated properties and methods.
	*/
		removeComponent: function (id, soft) {
			if (soft === false) {
				var props = components[id], prop;
				for (prop in props) {
					delete this[prop];
				}
			}
			delete this.__c[id];

			this.trigger("RemoveComponent", id);
			return this;
		},

		/**@
	* #.has
	* @comp Crafty Core
	* @sign public Boolean .has(String component)
	* Returns `true` or `false` depending on if the
	* entity has the given component.
	*
	* For better performance, simply use the `.__c` object
	* which will be `true` if the entity has the component or
	* will not exist (or be `false`).
	*/
		has: function (id) {
			return !!this.__c[id];
		},

		/**@
	* #.attr
	* @comp Crafty Core
	* @sign public this .attr(String property, * value)
	* @param property - Property of the entity to modify
	* @param value - Value to set the property to
	* @sign public this .attr(Object map)
	* @param map - Object where the key is the property to modify and the value as the property value
	* @trigger Change - when properties change - {key: value}
	* Use this method to set any property of the entity.
	* @example
	* ~~~
	* this.attr({key: "value", prop: 5});
	* this.key; //value
	* this.prop; //5
	*
	* this.attr("key", "newvalue");
	* this.key; //newvalue
	* ~~~
	*/
		attr: function (key, value) {
			if (arguments.length === 1) {
				//if just the key, return the value
				if (typeof key === "string") {
					return this[key];
				}

				//extend if object
				this.extend(key);
				this.trigger("Change", key); //trigger change event
				return this;
			}
			//if key value pair
			this[key] = value;

			var change = {};
			change[key] = value;
			this.trigger("Change", change); //trigger change event
			return this;
		},

		/**@
	* #.toArray
	* @comp Crafty Core
	* @sign public this .toArray(void)
	* This method will simply return the found entities as an array.
	*/
		toArray: function () {
			return slice.call(this, 0);
		},

		/**@
	* #.delay
	* @comp Crafty Core
	* @sign public this .delay(Function callback, Number delay)
	* @param callback - Method to execute after given amount of milliseconds
	* @param delay - Amount of milliseconds to execute the method
	* The delay method will execute a function after a given amount of time in milliseconds.
	*
	* Essentially a wrapper for `setTimeout`.
	*
	* @example
    * Destroy itself after 100 milliseconds
	* ~~~
	* this.delay(function() {
	     this.destroy();
	* }, 100);
	* ~~~
	*/
		delay: function (fn, duration) {
			this.each(function () {
				var self = this;
				setTimeout(function () {
					fn.call(self);
				}, duration);
			});
			return this;
		},

		/**@
	* #.bind
	* @comp Crafty Core
	* @sign public this .bind(String eventName, Function callback)
	* @param eventName - Name of the event to bind to
	* @param callback - Method to execute when the event is triggered
	* Attach the current entity (or entities) to listen for an event.
	*
	* Callback will be invoked when an event with the event name passed
	* is triggered. Depending on the event, some data may be passed
	* via an argument to the callback function.
	*
	* The first argument is the event name (can be anything) whilst the
	* second argument is the callback. If the event has data, the
	* callback should have an argument.
	*
	* Events are arbitrary and provide communication between components.
	* You can trigger or bind an event even if it doesn't exist yet.
	* @example
	* ~~~
	* this.attr("triggers", 0); //set a trigger count
	* this.bind("myevent", function() {
	*     this.triggers++; //whenever myevent is triggered, increment
	* });
	* this.bind("EnterFrame", function() {
	*     this.trigger("myevent"); //trigger myevent on every frame
	* });
	* ~~~
	* @see .trigger, .unbind
	*/
		bind: function (event, fn) {
			//optimization for 1 entity
			if (this.length === 1) {
				if (!handlers[event]) handlers[event] = {};
				var h = handlers[event];

				if (!h[this[0]]) h[this[0]] = []; //init handler array for entity
				h[this[0]].push(fn); //add current fn
				return this;
			}

			this.each(function () {
				//init event collection
				if (!handlers[event]) handlers[event] = {};
				var h = handlers[event];

				if (!h[this[0]]) h[this[0]] = []; //init handler array for entity
				h[this[0]].push(fn); //add current fn
			});
			return this;
		},

		/**@
	* #.unbind
	* @comp Crafty Core
	* @sign public this .unbind(String eventName[, Function callback])
	* @param eventName - Name of the event to unbind
	* @param callback - Function to unbind
	* Removes binding with an event from current entity.
	*
	* Passing an event name will remove all events binded to
	* that event. Passing a reference to the callback will
	* unbind only that callback.
	* @see .bind, .trigger
	*/
		unbind: function (event, fn) {
			this.each(function () {
				var hdl = handlers[event], i = 0, l, current;
				//if no events, cancel
				if (hdl && hdl[this[0]]) l = hdl[this[0]].length;
				else return this;

				//if no function, delete all
				if (!fn) {
					delete hdl[this[0]];
					return this;
				}
				//look for a match if the function is passed
				for (; i < l; i++) {
					current = hdl[this[0]];
					if (current[i] == fn) {
						current.splice(i, 1);
						i--;
					}
				}
			});

			return this;
		},

		/**@
	* #.trigger
	* @comp Crafty Core
	* @sign public this .trigger(String eventName[, Object data])
	* @param eventName - Event to trigger
	* @param data - Arbitrary data that will be passed into every callback as an argument
	* Trigger an event with arbitrary data. Will invoke all callbacks with
	* the context (value of `this`) of the current entity object.
	*
	* *Note: This will only execute callbacks within the current entity, no other entity.*
	*
	* The first argument is the event name to trigger and the optional
	* second argument is the arbitrary event data. This can be absolutely anything.
	*/
		trigger: function (event, data) {
			if (this.length === 1) {
				//find the handlers assigned to the event and entity
				if (handlers[event] && handlers[event][this[0]]) {
					var fns = handlers[event][this[0]], i = 0, l = fns.length;
					for (; i < l; i++) {
						fns[i].call(this, data);
					}
				}
				return this;
			}

			this.each(function () {
				//find the handlers assigned to the event and entity
				if (handlers[event] && handlers[event][this[0]]) {
					var fns = handlers[event][this[0]], i = 0, l = fns.length;
					for (; i < l; i++) {
						fns[i].call(this, data);
					}
				}
			});
			return this;
		},

		/**@
	* #.each
	* @sign public this .each(Function method)
	* @param method - Method to call on each iteration
	* Iterates over found entities, calling a function for every entity.
	*
	* The function will be called for every entity and will pass the index
	* in the iteration as an argument. The context (value of `this`) of the
	* function will be the current entity in the iteration.
	* @example
	* Destroy every second 2D entity
	* ~~~
	* Crafty("2D").each(function(i) {
	*     if(i % 2 === 0) {
	*         this.destroy();
	*     }
	* });
	* ~~~
	*/
		each: function (fn) {
			var i = 0, l = this.length;
			for (; i < l; i++) {
				//skip if not exists
				if (!entities[this[i]]) continue;
				fn.call(entities[this[i]], i);
			}
			return this;
		},

		/**@
	* #.clone
	* @comp Crafty Core
	* @sign public Entity .clone(void)
	* @returns Cloned entity of the current entity
	* Method will create another entity with the exact same
	* properties, components and methods as the current entity.
	*/
		clone: function () {
			var comps = this.__c,
			comp,
			prop,
			clone = Crafty.e();

			for (comp in comps) {
				clone.addComponent(comp);
			}
			for (prop in this) {
				clone[prop] = this[prop];
			}

			return clone;
		},

		/**@
	* #.setter
	* @comp Crafty Core
	* @sign public this .setter(String property, Function callback)
	* @param property - Property to watch for modification
	* @param callback - Method to execute if the property is modified
	* Will watch a property waiting for modification and will then invoke the
	* given callback when attempting to modify.
	*
	* *Note: Support in IE<9 is slightly different. The method will be executed
	* after the property has been set*
	*/
		setter: function (prop, fn) {
			if (Crafty.support.setter) {
				this.__defineSetter__(prop, fn);
			} else if (Crafty.support.defineProperty) {
				Object.defineProperty(this, prop, {
					set: fn,
					configurable: true
				});
			} else {
				noSetter.push({
					prop: prop,
					obj: this,
					fn: fn
				});
			}
			return this;
		},

		/**@
	* #.destroy
	* @comp Crafty Core
	* @sign public this .destroy(void)
	* Will remove all event listeners and delete all properties as well as removing from the stage
	*/
		destroy: function () {
			//remove all event handlers, delete from entities
			this.each(function () {
				this.trigger("Remove");
				for (var e in handlers) {
					this.unbind(e);
				}
				delete entities[this[0]];
			});
		}
	};

	//give the init instances the Crafty prototype
	Crafty.fn.init.prototype = Crafty.fn;

	/**
* Extension method to extend the namespace and
* selector instances
*/
	Crafty.extend = Crafty.fn.extend = function (obj) {
		var target = this, key;

		//don't bother with nulls
		if (!obj) return target;

		for (key in obj) {
			if (target === obj[key]) continue; //handle circular reference
			target[key] = obj[key];
		}

		return target;
	};

	/**@
* #Crafty.extend
* @category Core
* Used to extend the Crafty namespace.
*/
	Crafty.extend({
	/**@
	* #Crafty.init
	* @category Core
	* @trigger EnterFrame - on each frame - { frame: Number }
	* @trigger Load - Just after the viewport is initialised. Before the EnterFrame loops is started
	* @sign public this Crafty.init([Number width, Number height])
	* @param width - Width of the stage
	* @param height - Height of the stage
	* Starts the `EnterFrame` interval. This will call the `EnterFrame` event for every frame.
	*
	* Can pass width and height values for the stage otherwise will default to window size (see `Crafty.DOM.window`).
	*
	* All `Load` events will be executed.
	*
	* Uses `requestAnimationFrame` to sync the drawing with the browser but will default to `setInterval` if the browser does not support it.
	* @see Crafty.stop
	*/
		init: function (w, h) {
			Crafty.viewport.init(w, h);

			//call all arbitrary functions attached to onload
			this.trigger("Load");
			this.timer.init();

			return this;
		},

		/**@
	* #Crafty.stop
	* @category Core
	* @trigger CraftyStop - when the game is stopped
	* @sign public this Crafty.stop(void)
	* Stops the EnterFrame interval and removes the stage element.
	*
	* To restart, use `Crafty.init()`.
	* @see Crafty.init
	*/
		stop: function () {
			this.timer.stop();
			Crafty.stage.elem.parentNode.removeChild(Crafty.stage.elem);

			return this;
		},

		/**@
	* #Crafty.pause
	* @category Core
	* @trigger Pause - when the game is paused
	* @trigger Unpause - when the game is unpaused
	* @sign public this Crafty.pause(void)
	* Pauses the game by stoping the EnterFrame event from firing. If the game is already paused it is unpaused.
	* You can pass a boolean parameter if you want to pause or unpause mo matter what the current state is.
	* Modern browsers pauses the game when the page is not visible to the user. If you want the Pause event
	* to be triggered when that happens you can enable autoPause in `Crafty.settings`.
	* @example
	* Have an entity pause the game when it is clicked.
	* ~~~
	* button.bind("click", function() {
	* 	Crafty.pause();
	* });
	* ~~~
	*/
		pause: function (toggle) {
			if (arguments.length == 1 ? toggle : !this._paused) {
				this.trigger('Pause');
				this._paused = true;

				Crafty.timer.stop();
				Crafty.keydown = {};
			} else {
				this.trigger('Unpause');
				this._paused = false;

				Crafty.timer.init();
			}
			return this;
		},
		/**@
	* #Crafty.timer
	* @category Internal
	* Handles game ticks
	*/
		timer: {
			prev: (+new Date),
			current: (+new Date),
			curTime: Date.now(),

			init: function () {
				var onFrame = window.requestAnimationFrame ||
					window.webkitRequestAnimationFrame ||
					window.mozRequestAnimationFrame ||
					window.oRequestAnimationFrame ||
					window.msRequestAnimationFrame ||
					null;

				if (onFrame) {
					tick = function () {
						Crafty.timer.step();
						tickID = onFrame(tick);
					}

					tick();
				} else {
					tick = setInterval(Crafty.timer.step, 1000 / FPS);
				}
			},

			stop: function () {
				Crafty.trigger("CraftyStop");

				if (typeof tick === "number") clearInterval(tick);

				var onFrame = window.cancelRequestAnimationFrame ||
					window.webkitCancelRequestAnimationFrame ||
					window.mozCancelRequestAnimationFrame ||
					window.oCancelRequestAnimationFrame ||
					window.msCancelRequestAnimationFrame ||
					null;

				if (onFrame) onFrame(tickID);
				tick = null;
			},

			/**@
		* #Crafty.timer.step
		* @comp Crafty.timer
		* @sign public void Crafty.timer.step()
		* Advances the game by triggering `EnterFrame` and calls `Crafty.DrawManager.draw` to update the stage.
		*/
			step: function () {
				loops = 0;
				this.curTime = Date.now();
				if (this.curTime - nextGameTick > 60 * skipTicks) {
					nextGameTick = this.curTime - skipTicks;
				}
				while (this.curTime > nextGameTick) {
					Crafty.trigger("EnterFrame", { frame: frame++ });
					nextGameTick += skipTicks;
					loops++;
				}
				if (loops) {
					Crafty.DrawManager.draw();
				}
			},
			/**@
		* #Crafty.timer.getFPS
		* @comp Crafty.timer
		* @sign public void Crafty.timer.getFPS()
		* Returns the target frames per second. This is not an actual frame rate.
		*/
			getFPS: function () {
				return FPS;
			},
			/**@
		* #Crafty.timer.simulateFrames
		* @comp Crafty.timer
		* Advances the game state by a number of frames and draws the resulting stage at the end. Useful for tests and debugging.
		* @sign public this Crafty.timer.simulateFrames(Number frames)
		* @param frames - number of frames to simulate
		*/
			simulateFrames: function (frames) {
				while (frames-- > 0) {
					Crafty.trigger("EnterFrame", { frame: frame++ });
				}
				Crafty.DrawManager.draw();
			}

		},

		/**@
	* #Crafty.e
	* @category Core
	* @trigger NewEntity - When the entity is created and all components are added - { id:Number }
	* @sign public Entity Crafty.e(String componentList)
	* @param componentList - List of components to assign to new entity
	* @sign public Entity Crafty.e(String component1[, .., String componentN])
	* @param component# - Component to add
	* Creates an entity. Any arguments will be applied in the same
	* way `.addComponent()` is applied as a quick way to add components.
	*
	* Any component added will augment the functionality of
	* the created entity by assigning the properties and methods from the component to the entity.
	* ~~~
	* var myEntity = Crafty.e("2D, DOM, Color");
	* ~~~
	* @see Crafty.c
	*/
		e: function () {
			var id = UID(), craft;

			entities[id] = null; //register the space
			entities[id] = craft = Crafty(id);

			if (arguments.length > 0) {
				craft.addComponent.apply(craft, arguments);
			}
			craft.addComponent("obj"); //every entity automatically assumes obj

			Crafty.trigger("NewEntity", { id: id });

			return craft;
		},

		/**@
	* #Crafty.c
	* @category Core
	* @sign public void Crafty.c(String name, Object component)
	* @param name - Name of the component
	* @param component - Object with the components properties and methods
	* Creates a component where the first argument is the ID and the second
	* is the object that will be inherited by entities.
	*
	* There is a convention for writing components. Properties or
	* methods that start with an underscore are considered private.
	* A method called `init` will automatically be called as soon as the
	* component is added to an entity.
	* A method with the same name as the component is considered to be a constructor
	* and is generally used when data is needed before executing.
	*
	* ~~~
	* Crafty.c("Annoying", {
	*     _message: "HiHi",
	*     init: function() {
	*         this.bind("EnterFrame", function() { alert(this.message); });
	*     },
	*     annoying: function(message) { this.message = message; }
	* });
	*
	* Crafty.e("Annoying").annoying("I'm an orange...");
	* ~~~
	* @see Crafty.e
	*/
		c: function (id, fn) {
			components[id] = fn;
		},

		/**@
	* #Crafty.trigger
	* @category Core, Events
	* @sign public void Crafty.trigger(String eventName, * data)
	* @param eventName - Name of the event to trigger
	* @param data - Arbitrary data to pass into the callback as an argument
	* This method will trigger every single callback attached to the event name. This means
	* every global event and every entity that has a callback.
	* @see Crafty.bind
	*/
		trigger: function (event, data) {
			var hdl = handlers[event], h, i, l;
			//loop over every object bound
			for (h in hdl) {
				if (!hdl.hasOwnProperty(h)) continue;

				//loop over every handler within object
				for (i = 0, l = hdl[h].length; i < l; i++) {
					if (hdl[h] && hdl[h][i]) {
						//if an entity, call with that context
						if (entities[h]) {
							hdl[h][i].call(Crafty(+h), data);
						} else { //else call with Crafty context
							hdl[h][i].call(Crafty, data);
						}
					}
				}
			}
		},

		/**@
	* #Crafty.bind
	* @category Core, Events
	* @sign public Number bind(String eventName, Function callback)
	* @param eventName - Name of the event to bind to
	* @param callback - Method to execute upon event triggered
	* @returns ID of the current callback used to unbind
	* Binds to a global event. Method will be executed when `Crafty.trigger` is used
	* with the event name.
	* @see Crafty.trigger, Crafty.unbind
	*/
		bind: function (event, callback) {
			if (!handlers[event]) handlers[event] = {};
			var hdl = handlers[event];

			if (!hdl.global) hdl.global = [];
			return hdl.global.push(callback) - 1;
		},

		/**@
	* #Crafty.unbind
	* @category Core, Events
	* @sign public Boolean Crafty.unbind(String eventName, Function callback)
	* @param eventName - Name of the event to unbind
	* @param callback - Function to unbind
	* @sign public Boolean Crafty.unbind(String eventName, Number callbackID)
	* @param callbackID - ID of the callback
	* @returns True or false depending on if a callback was unbound
	* Unbind any event from any entity or global event.
	*/
		unbind: function (event, callback) {
			var hdl = handlers[event], h, i, l;

			//loop over every object bound
			for (h in hdl) {
				if (!hdl.hasOwnProperty(h)) continue;

				//if passed the ID
				if (typeof callback === "number") {
					delete hdl[h][callback];
					return true;
				}

				//loop over every handler within object
				for (i = 0, l = hdl[h].length; i < l; i++) {
					if (hdl[h][i] === callback) {
						delete hdl[h][i];
						return true;
					}
				}
			}

			return false;
		},

		/**@
	* #Crafty.frame
	* @category Core
	* @sign public Number Crafty.frame(void)
	* Returns the current frame number
	*/
		frame: function () {
			return frame;
		},

		components: function () {
			return components;
		},

		isComp: function (comp) {
			return comp in components;
		},

		debug: function () {
			return entities;
		},

		/**@
	* #Crafty.settings
	* @category Core
	* Modify the inner workings of Crafty through the settings.
	*/
		settings: (function () {
			var states = {},
			callbacks = {};

			return {
			/**@
			* #Crafty.settings.register
			* @comp Crafty.settings
			* @sign public void Crafty.settings.register(String settingName, Function callback)
			* @param settingName - Name of the setting
			* @param callback - Function to execute when use modifies setting
			* Use this to register custom settings. Callback will be executed when `Crafty.settings.modify` is used.
			* @see Crafty.settings.modify
			*/
				register: function (setting, callback) {
					callbacks[setting] = callback;
				},

				/**@
			* #Crafty.settings.modify
			* @comp Crafty.settings
			* @sign public void Crafty.settings.modify(String settingName, * value)
			* @param settingName - Name of the setting
			* @param value - Value to set the setting to
			* Modify settings through this method.
			* @see Crafty.settings.register, Crafty.settings.get
			*/
				modify: function (setting, value) {
					if (!callbacks[setting]) return;
					callbacks[setting].call(states[setting], value);
					states[setting] = value;
				},

				/**@
			* #Crafty.settings.get
			* @comp Crafty.settings
			* @sign public * Crafty.settings.get(String settingName)
			* @param settingName - Name of the setting
			* @returns Current value of the setting
			* Returns the current value of the setting.
			* @see Crafty.settings.register, Crafty.settings.get
			*/
				get: function (setting) {
					return states[setting];
				}
			};
		})(),

		clone: clone
	});

	/**
* Return a unique ID
*/
	function UID() {
		var id = GUID++;
		//if GUID is not unique
		if (id in entities) {
			return UID(); //recurse until it is unique
		}
		return id;
	}

	/**
* Clone an Object
*/
	function clone(obj) {
		if (obj === null || typeof(obj) != 'object')
			return obj;

		var temp = obj.constructor(); // changed

		for (var key in obj)
			temp[key] = clone(obj[key]);
		return temp;
	}

	Crafty.bind("Load", function () {
		if (!Crafty.support.setter && Crafty.support.defineProperty) {
			noSetter = [];
			Crafty.bind("EnterFrame", function () {
				var i = 0, l = noSetter.length, current;
				for (; i < l; ++i) {
					current = noSetter[i];
					if (current.obj[current.prop] !== current.obj['_' + current.prop]) {
						current.fn.call(current.obj, current.obj[current.prop]);
					}
				}
			});
		}
	});

	//make Crafty global
	window.Crafty = Crafty;
})(window); //wrap around components
(function(Crafty, window, document) {
 /**
* Spatial HashMap for broad phase collision
*
* @author Louis Stowasser
*/
(function (parent) {

	var cellsize,
	HashMap = function (cell) {
		cellsize = cell || 64;
		this.map = {};
	},
	SPACE = " ";

	HashMap.prototype = {
		insert: function (obj) {
			var keys = HashMap.key(obj),
			entry = new Entry(keys, obj, this),
			i = 0,
			j,
			hash;

			//insert into all x buckets
			for (i = keys.x1; i <= keys.x2; i++) {
				//insert into all y buckets
				for (j = keys.y1; j <= keys.y2; j++) {
					hash = i + SPACE + j;
					if (!this.map[hash]) this.map[hash] = [];
					this.map[hash].push(obj);
				}
			}

			return entry;
		},

		search: function (rect, filter) {
			var keys = HashMap.key(rect),
			i, j,
			hash,
			results = [];

			if (filter === undefined) filter = true; //default filter to true

			//search in all x buckets
			for (i = keys.x1; i <= keys.x2; i++) {
				//insert into all y buckets
				for (j = keys.y1; j <= keys.y2; j++) {
					hash = i + SPACE + j;

					if (this.map[hash]) {
						results = results.concat(this.map[hash]);
					}
				}
			}

			if (filter) {
				var obj, id, finalresult = [], found = {};
				//add unique elements to lookup table with the entity ID as unique key
				for (i = 0, l = results.length; i < l; i++) {
					obj = results[i];
					if (!obj) continue; //skip if deleted
					id = obj[0]; //unique ID

					//check if not added to hash and that actually intersects
					if (!found[id] && obj.x < rect._x + rect._w && obj._x + obj._w > rect._x &&
								 obj.y < rect._y + rect._h && obj._h + obj._y > rect._y)
						found[id] = results[i];
				}

				//loop over lookup table and copy to final array
				for (obj in found) finalresult.push(found[obj]);

				return finalresult;
			} else {
				return results;
			}
		},

		remove: function (keys, obj) {
			var i = 0, j, hash;

			if (arguments.length == 1) {
				obj = keys;
				keys = HashMap.key(obj);
			}

			//search in all x buckets
			for (i = keys.x1; i <= keys.x2; i++) {
				//insert into all y buckets
				for (j = keys.y1; j <= keys.y2; j++) {
					hash = i + SPACE + j;

					if (this.map[hash]) {
						var cell = this.map[hash], m = 0, n = cell.length;
						//loop over objs in cell and delete
						for (; m < n; m++) if (cell[m] && cell[m][0] === obj[0])
								cell.splice(m, 1);
					}
				}
			}
		},

		boundaries: function () {
			var k, ent,
			hash = {
				max: { x: -Infinity, y: -Infinity },
				min: { x: Infinity, y: Infinity }
			},
			coords = {
				max: { x: -Infinity, y: -Infinity },
				min: { x: Infinity, y: Infinity }
			};

			for (var h in this.map) {
				if (!this.map[h].length) continue;

				var coord = h.split(SPACE);
				if (coord[0] >= hash.max.x) {
					hash.max.x = coord[0];
					for (k in this.map[h]) {
						ent = this.map[h][k];
						//make sure that this is a Crafty entity
						if (typeof ent == 'object' && 'requires' in ent) {
							coords.max.x = Math.max(coords.max.x, ent.x + ent.w);
						}
					}
				}
				if (coord[0] <= hash.min.x) {
					hash.min.x = coord[0];
					for (k in this.map[h]) {
						ent = this.map[h][k];
						if (typeof ent == 'object' && 'requires' in ent) {
							coords.min.x = Math.min(coords.min.x, ent.x);
						}
					}
				}
				if (coord[1] >= hash.max.y) {
					hash.max.y = coord[1];
					for (k in this.map[h]) {
						ent = this.map[h][k];
						if (typeof ent == 'object' && 'requires' in ent) {
							coords.max.y = Math.max(coords.max.y, ent.y + ent.h);
						}
					}
				}
				if (coord[1] <= hash.min.y) {
					hash.min.y = coord[1];
					for (k in this.map[h]) {
						ent = this.map[h][k];
						if (typeof ent == 'object' && 'requires' in ent) {
							coords.min.y = Math.min(coords.min.y, ent.y);
						}
					}
				}
			}

			return coords;
		}
	};

	HashMap.key = function (obj) {
		if (obj.hasOwnProperty('mbr')) {
			obj = obj.mbr();
		}
		var x1 = Math.floor(obj._x / cellsize),
		y1 = Math.floor(obj._y / cellsize),
		x2 = Math.floor((obj._w + obj._x) / cellsize),
		y2 = Math.floor((obj._h + obj._y) / cellsize);
		return { x1: x1, y1: y1, x2: x2, y2: y2 };
	};

	HashMap.hash = function (keys) {
		return keys.x1 + SPACE + keys.y1 + SPACE + keys.x2 + SPACE + keys.y2;
	};

	function Entry(keys, obj, map) {
		this.keys = keys;
		this.map = map;
		this.obj = obj;
	}

	Entry.prototype = {
		update: function (rect) {
			//check if buckets change
			if (HashMap.hash(HashMap.key(rect)) != HashMap.hash(this.keys)) {
				this.map.remove(this.keys, this.obj);
				var e = this.map.insert(this.obj);
				this.keys = e.keys;
			}
		}
	};

	parent.HashMap = HashMap;
})(Crafty); Crafty.map = new Crafty.HashMap();
var M = Math,
	Mc = M.cos,
	Ms = M.sin,
	PI = M.PI,
	DEG_TO_RAD = PI / 180;


/**@
* #2D
* @category 2D
* Component for any entity that has a position on the stage.
* @trigger Move - when the entity has moved - { _x:Number, _y:Number, _w:Number, _h:Number } - Old position
* @trigger Change - when the entity has moved - { _x:Number, _y:Number, _w:Number, _h:Number } - Old position
* @trigger Rotate - when the entity is rotated - { cos:Number, sin:Number, deg:Number, rad:Number, o: {x:Number, y:Number}, matrix: {M11, M12, M21, M22} }
*/
Crafty.c("2D", {
/**@
	* #.x
	* The `x` position on the stage. When modified, will automatically be redrawn.
	* Is actually a getter/setter so when using this value for calculations and not modifying it,
	* use the `._x` property.
	*/
	_x: 0,
	/**@
	* #.y
	* The `y` position on the stage. When modified, will automatically be redrawn.
	* Is actually a getter/setter so when using this value for calculations and not modifying it,
	* use the `._y` property.
	*/
	_y: 0,
	/**@
	* #.w
	* The width of the entity. When modified, will automatically be redrawn.
	* Is actually a getter/setter so when using this value for calculations and not modifying it,
	* use the `._w` property.
	*
	* Changing this value is not recommended as canvas has terrible resize quality and DOM will just clip the image.
	*/
	_w: 0,
	/**@
	* #.x
	* The height of the entity. When modified, will automatically be redrawn.
	* Is actually a getter/setter so when using this value for calculations and not modifying it,
	* use the `._h` property.
	*
	* Changing this value is not recommended as canvas has terrible resize quality and DOM will just clip the image.
	*/
	_h: 0,
	/**@
	* #.z
	* The `z` index on the stage. When modified, will automatically be redrawn.
	* Is actually a getter/setter so when using this value for calculations and not modifying it,
	* use the `._z` property.
	*
	* A higher `z` value will be closer to the front of the stage. A smaller `z` value will be closer to the back.
	* A global Z index is produced based on its `z` value as well as the GID (which entity was created first).
	* Therefore entities will naturally maintain order depending on when it was created if same z value.
	*/
	_z: 0,
	/**@
	* #.rotation
	* Set the rotation of your entity. Rotation takes degrees in a clockwise direction.
	* It is important to note there is no limit on the rotation value. Setting a rotation
	* mod 360 will give the same rotation without reaching huge numbers.
	*/
	_rotation: 0,
	/**@
	* #.alpha
	* Transparency of an entity. Must be a decimal value between 0.0 being fully transparent to 1.0 being fully opaque.
	*/
	_alpha: 1.0,
	/**@
	* #.visible
	* If the entity is visible or not. Accepts a true or false value.
	* Can be used for optimization by setting an entities visibility to false when not needed to be drawn.
	*
	* The entity will still exist and can be collided with but just won't be drawn.
	*/
	_visible: true,
	_global: null,

	_origin: null,
	_mbr: null,
	_entry: null,
	_children: null,
	_parent: null,
	_changed: false,

	init: function () {
		this._global = this[0];
		this._origin = { x: 0, y: 0 };
		this._children = [];

		if (Crafty.support.setter) {
			//create getters and setters
			this.__defineSetter__('x', function (v) { this._attr('_x', v); });
			this.__defineSetter__('y', function (v) { this._attr('_y', v); });
			this.__defineSetter__('w', function (v) { this._attr('_w', v); });
			this.__defineSetter__('h', function (v) { this._attr('_h', v); });
			this.__defineSetter__('z', function (v) { this._attr('_z', v); });
			this.__defineSetter__('rotation', function (v) { this._attr('_rotation', v); });
			this.__defineSetter__('alpha', function (v) { this._attr('_alpha', v); });
			this.__defineSetter__('visible', function (v) { this._attr('_visible', v); });

			this.__defineGetter__('x', function () { return this._x; });
			this.__defineGetter__('y', function () { return this._y; });
			this.__defineGetter__('w', function () { return this._w; });
			this.__defineGetter__('h', function () { return this._h; });
			this.__defineGetter__('z', function () { return this._z; });
			this.__defineGetter__('rotation', function () { return this._rotation; });
			this.__defineGetter__('alpha', function () { return this._alpha; });
			this.__defineGetter__('visible', function () { return this._visible; });
			this.__defineGetter__('parent', function () { return this._parent; });
			this.__defineGetter__('numChildren', function () { return this._children.length; });

			//IE9 supports Object.defineProperty
		} else if (Crafty.support.defineProperty) {

			Object.defineProperty(this, 'x', { set: function (v) { this._attr('_x', v); }, get: function () { return this._x; }, configurable: true });
			Object.defineProperty(this, 'y', { set: function (v) { this._attr('_y', v); }, get: function () { return this._y; }, configurable: true });
			Object.defineProperty(this, 'w', { set: function (v) { this._attr('_w', v); }, get: function () { return this._w; }, configurable: true });
			Object.defineProperty(this, 'h', { set: function (v) { this._attr('_h', v); }, get: function () { return this._h; }, configurable: true });
			Object.defineProperty(this, 'z', { set: function (v) { this._attr('_z', v); }, get: function () { return this._z; }, configurable: true });

			Object.defineProperty(this, 'rotation', {
				set: function (v) { this._attr('_rotation', v); }, get: function () { return this._rotation; }, configurable: true
			});

			Object.defineProperty(this, 'alpha', {
				set: function (v) { this._attr('_alpha', v); }, get: function () { return this._alpha; }, configurable: true
			});

			Object.defineProperty(this, 'visible', {
				set: function (v) { this._attr('_visible', v); }, get: function () { return this._visible; }, configurable: true
			});

		} else {
			/*
			if no setters, check on every frame for a difference
			between this._(x|y|w|h|z...) and this.(x|y|w|h|z)
			*/

			//set the public properties to the current private properties
			this.x = this._x;
			this.y = this._y;
			this.w = this._w;
			this.h = this._h;
			this.z = this._z;
			this.rotation = this._rotation;
			this.alpha = this._alpha;
			this.visible = this._visible;

			//on every frame check for a difference in any property
			this.bind("EnterFrame", function () {
				//if there are differences between the public and private properties
				if (this.x !== this._x || this.y !== this._y ||
				   this.w !== this._w || this.h !== this._h ||
				   this.z !== this._z || this.rotation !== this._rotation ||
				   this.alpha !== this._alpha || this.visible !== this._visible) {

					//save the old positions
					var old = this.mbr() || this.pos();

					//if rotation has changed, use the private rotate method
					if (this.rotation !== this._rotation) {
						this._rotate(this.rotation);
					} else {
						//update the MBR
						var mbr = this._mbr, moved = false;
						if (mbr) { //check each value to see which has changed
							if (this.x !== this._x) { mbr._x -= this.x - this._x; moved = true; }
							else if (this.y !== this._y) { mbr._y -= this.y - this._y; moved = true; }
							else if (this.w !== this._w) { mbr._w -= this.w - this._w; moved = true; }
							else if (this.h !== this._h) { mbr._h -= this.h - this._h; moved = true; }
							else if (this.z !== this._z) { mbr._z -= this.z - this._z; moved = true; }
						}

						//if the moved flag is true, trigger a move
						if (moved) this.trigger("Move", old);
					}

					//set the public properties to the private properties
					this._x = this.x;
					this._y = this.y;
					this._w = this.w;
					this._h = this.h;
					this._z = this.z;
					this._rotation = this.rotation;
					this._alpha = this.alpha;
					this._visible = this.visible;

					//trigger the changes
					this.trigger("Change", old);
					//without this entities weren't added correctly to Crafty.map.map in IE8.
					//not entirely sure this is the best way to fix it though
					this.trigger("Move", old);
				}
			});
		}

		//insert self into the HashMap
		this._entry = Crafty.map.insert(this);

		//when object changes, update HashMap
		this.bind("Move", function (e) {
			var area = this._mbr || this;
			this._entry.update(area);
			this._cascade(e);
		});

		this.bind("Rotate", function (e) {
			var old = this._mbr || this;
			this._entry.update(old);
			this._cascade(e);
		});

		//when object is removed
		this.bind("Remove", function () {

			Crafty.map.remove(this);

			this.detach();
		});
	},

	/**
	* Calculates the MBR when rotated with an origin point
	*/
	_rotate: function (v) {
		var theta = -1 * (v % 360), //angle always between 0 and 359
			rad = theta * DEG_TO_RAD,
			ct = Math.cos(rad), //cache the sin and cosine of theta
			st = Math.sin(rad),
			o = {
			x: this._origin.x + this._x,
			y: this._origin.y + this._y
		};

		//if the angle is 0 and is currently 0, skip
		if (!theta) {
			this._mbr = null;
			if (!this._rotation % 360) return;
		}

		var x0 = o.x + (this._x - o.x) * ct + (this._y - o.y) * st,
			y0 = o.y - (this._x - o.x) * st + (this._y - o.y) * ct,
			x1 = o.x + (this._x + this._w - o.x) * ct + (this._y - o.y) * st,
			y1 = o.y - (this._x + this._w - o.x) * st + (this._y - o.y) * ct,
			x2 = o.x + (this._x + this._w - o.x) * ct + (this._y + this._h - o.y) * st,
			y2 = o.y - (this._x + this._w - o.x) * st + (this._y + this._h - o.y) * ct,
			x3 = o.x + (this._x - o.x) * ct + (this._y + this._h - o.y) * st,
			y3 = o.y - (this._x - o.x) * st + (this._y + this._h - o.y) * ct,
			minx = Math.floor(Math.min(x0, x1, x2, x3)),
			miny = Math.floor(Math.min(y0, y1, y2, y3)),
			maxx = Math.ceil(Math.max(x0, x1, x2, x3)),
			maxy = Math.ceil(Math.max(y0, y1, y2, y3));

		this._mbr = { _x: minx, _y: miny, _w: maxx - minx, _h: maxy - miny };

		//trigger rotation event
		var difference = this._rotation - v,
			drad = difference * DEG_TO_RAD;

		this.trigger("Rotate", {
			cos: Math.cos(drad),
			sin: Math.sin(drad),
			deg: difference,
			rad: drad,
			o: { x: o.x, y: o.y },
			matrix: { M11: ct, M12: st, M21: -st, M22: ct }
		});
	},

	/**@
	* #.area
	* @comp 2D
	* @sign public Number .area(void)
	* Calculates the area of the entity
	*/
	area: function () {
		return this._w * this._h;
	},

	/**@
	* #.intersect
	* @comp 2D
	* @sign public Boolean .intersect(Number x, Number y, Number w, Number h)
	* @param x - X position of the rect
	* @param y - Y position of the rect
	* @param w - Width of the rect
	* @param h - Height of the rect
	* @sign public Boolean .intersect(Object rect)
	* @param rect - An object that must have the `x, y, w, h` values as properties
	* Determines if this entity intersects a rectangle.
	*/
	intersect: function (x, y, w, h) {
		var rect, obj = this._mbr || this;
		if (typeof x === "object") {
			rect = x;
		} else {
			rect = { x: x, y: y, w: w, h: h };
		}

		return obj._x < rect.x + rect.w && obj._x + obj._w > rect.x &&
			   obj._y < rect.y + rect.h && obj._h + obj._y > rect.y;
	},

	/**@
	* #.within
	* @comp 2D
	* @sign public Boolean .within(Number x, Number y, Number w, Number h)
	* @param x - X position of the rect
	* @param y - Y position of the rect
	* @param w - Width of the rect
	* @param h - Height of the rect
	* @sign public Boolean .within(Object rect)
	* @param rect - An object that must have the `x, y, w, h` values as properties
	* Determines if this current entity is within another rectangle.
	*/
	within: function (x, y, w, h) {
		var rect;
		if (typeof x === "object") {
			rect = x;
		} else {
			rect = { x: x, y: y, w: w, h: h };
		}

		return rect.x <= this.x && rect.x + rect.w >= this.x + this.w &&
				rect.y <= this.y && rect.y + rect.h >= this.y + this.h;
	},

	/**@
	* #.contains
	* @comp 2D
	* @sign public Boolean .contains(Number x, Number y, Number w, Number h)
	* @param x - X position of the rect
	* @param y - Y position of the rect
	* @param w - Width of the rect
	* @param h - Height of the rect
	* @sign public Boolean .contains(Object rect)
	* @param rect - An object that must have the `x, y, w, h` values as properties
	* Determines if the rectangle is within the current entity.
	*/
	contains: function (x, y, w, h) {
		var rect;
		if (typeof x === "object") {
			rect = x;
		} else {
			rect = { x: x, y: y, w: w, h: h };
		}

		return rect.x >= this.x && rect.x + rect.w <= this.x + this.w &&
				rect.y >= this.y && rect.y + rect.h <= this.y + this.h;
	},

	/**@
	* #.pos
	* @comp 2D
	* @sign public Object .pos(void)
	* Returns the x, y, w, h properties as a rect object
	* (a rect object is just an object with the keys _x, _y, _w, _h).
	*
	* The keys have an underscore prefix. This is due to the x, y, w, h
	* properties being merely setters and getters that wrap the properties with an underscore (_x, _y, _w, _h).
	*/
	pos: function () {
		return {
			_x: (this._x),
			_y: (this._y),
			_w: (this._w),
			_h: (this._h)
		};
	},

	/**
	* Returns the minimum bounding rectangle. If there is no rotation
	* on the entity it will return the rect.
	*/
	mbr: function () {
		if (!this._mbr) return this.pos();
		return {
			_x: (this._mbr._x),
			_y: (this._mbr._y),
			_w: (this._mbr._w),
			_h: (this._mbr._h)
		};
	},

	/**@
	* #.isAt
	* @comp 2D
	* @sign public Boolean .isAt(Number x, Number y)
	* @param x - X position of the point
	* @param y - Y position of the point
	* Determines whether a point is contained by the entity. Unlike other methods,
	* an object can't be passed. The arguments require the x and y value
	*/
	isAt: function (x, y) {
		if (this.map) {
			return this.map.containsPoint(x, y);
		}
		return this.x <= x && this.x + this.w >= x &&
			   this.y <= y && this.y + this.h >= y;
	},

	/**@
	* #.move
	* @comp 2D
	* @sign public this .move(String dir, Number by)
	* @param dir - Direction to move (n,s,e,w,ne,nw,se,sw)
	* @param by - Amount to move in the specified direction
	* Quick method to move the entity in a direction (n, s, e, w, ne, nw, se, sw) by an amount of pixels.
	*/
	move: function (dir, by) {
		if (dir.charAt(0) === 'n') this.y -= by;
		if (dir.charAt(0) === 's') this.y += by;
		if (dir === 'e' || dir.charAt(1) === 'e') this.x += by;
		if (dir === 'w' || dir.charAt(1) === 'w') this.x -= by;

		return this;
	},

	/**@
	* #.shift
	* @comp 2D
	* @sign public this .shift(Number x, Number y, Number w, Number h)
	* @param x - Amount to move X
	* @param y - Amount to move Y
	* @param w - Amount to widen
	* @param h - Amount to increase height
	* Shift or move the entity by an amount. Use negative values
	* for an opposite direction.
	*/
	shift: function (x, y, w, h) {
		if (x) this.x += x;
		if (y) this.y += y;
		if (w) this.w += w;
		if (h) this.h += h;

		return this;
	},

	/**
	* Move or rotate all the children for this entity
	*/
	_cascade: function (e) {
		if (!e) return; //no change in position
		var i = 0, children = this._children, l = children.length, obj;
		//rotation
		if (e.cos) {
			for (; i < l; ++i) {
				obj = children[i];
				if ('rotate' in obj) obj.rotate(e);
			}
		} else {
			//use MBR or current
			var rect = this._mbr || this,
				dx = rect._x - e._x,
				dy = rect._y - e._y,
				dw = rect._w - e._w,
				dh = rect._h - e._h;

			for (; i < l; ++i) {
				obj = children[i];
				obj.shift(dx, dy, dw, dh);
			}
		}
	},

	/**
	* #.attach
	* @comp 2D
	* @sign public this .attach(Entity obj[, .., Entity objN])
	* @param obj - Entity(s) to attach
	* Attaches an entities position and rotation to current entity. When the current entity moves,
	* the attached entity will move by the same amount.
	*
	* As many objects as wanted can be attached and a hierarchy of objects is possible by attaching.
	*/
	attach: function () {
		var i = 0, arg = arguments, l = arguments.length, obj;
		for (; i < l; ++i) {
			obj = arg[i];
			if (obj._parent) { obj._parent.detach(obj); }
			obj._parent = this;
			this._children.push(obj);
		}

		return this;
	},

	/**@
	* #.detach
	* @comp 2D
	* @sign public this .detach([Entity obj])
	* @param obj - The entity to detach. Left blank will remove all attached entities
	* Stop an entity from following the current entity. Passing no arguments will stop
	* every entity attached.
	*/
	detach: function (obj) {
		//if nothing passed, remove all attached objects
		if (!obj) {
			for (var i = 0; i < this._children.length; i++) {
				this._children[i]._parent = null;
			}
			this._children = [];
			return this;
		}

		//if obj passed, find the handler and unbind
		for (var i = 0; i < this._children.length; i++) {
			if (this._children[i] == obj) {
				this._children.splice(i, 1);
			}
		}
		obj._parent = null;

		return this;
	},

	/**@
	* #.origin
	* @comp 2D
	* @sign public this .origin(Number x, Number y)
	* @param x - Pixel value of origin offset on the X axis
	* @param y - Pixel value of origin offset on the Y axis
	* @sign public this .origin(String offset)
	* @param offset - Combination of center, top, bottom, middle, left and right
	* Set the origin point of an entity for it to rotate around.
	* @example
	* ~~~
	* this.origin("top left")
	* this.origin("center")
	* this.origin("bottom right")
	* this.origin("middle right")
	* ~~~
	* @see .rotation
	*/
	origin: function (x, y) {
		//text based origin
		if (typeof x === "string") {
			if (x === "centre" || x === "center" || x.indexOf(' ') === -1) {
				x = this._w / 2;
				y = this._h / 2;
			} else {
				var cmd = x.split(' ');
				if (cmd[0] === "top") y = 0;
				else if (cmd[0] === "bottom") y = this._h;
				else if (cmd[0] === "middle" || cmd[1] === "center" || cmd[1] === "centre") y = this._h / 2;

				if (cmd[1] === "center" || cmd[1] === "centre" || cmd[1] === "middle") x = this._w / 2;
				else if (cmd[1] === "left") x = 0;
				else if (cmd[1] === "right") x = this._w;
			}
		}

		this._origin.x = x;
		this._origin.y = y;

		return this;
	},

	flip: function (dir) {
		dir = dir || "X";
		this["_flip" + dir] = true;
		this.trigger("Change");
	},

	/**
	* Method for rotation rather than through a setter
	*/
	rotate: function (e) {
		//assume event data origin
		this._origin.x = e.o.x - this._x;
		this._origin.y = e.o.y - this._y;

		//modify through the setter method
		this._attr('_rotation', e.theta);
	},

	/**
	* Setter method for all 2D properties including
	* x, y, w, h, alpha, rotation and visible.
	*/
	_attr: function (name, value) {
		//keep a reference of the old positions
		var pos = this.pos(),
			old = this.mbr() || pos;

		//if rotation, use the rotate method
		if (name === '_rotation') {
			this._rotate(value);
			this.trigger("Rotate");
			//set the global Z and trigger reorder just incase
		} else if (name === '_z') {
			this._global = parseInt(value + Crafty.zeroFill(this[0], 5), 10); //magic number 10e5 is the max num of entities
			this.trigger("reorder");
			//if the rect bounds change, update the MBR and trigger move
		} else if (name == '_x' || name === '_y' || name === '_w' || name === '_h') {
			var mbr = this._mbr;
			if (mbr) {
				mbr[name] -= this[name] - value;
			}
			this[name] = value;
			this.trigger("Move", old);
		}

		//everything will assume the value
		this[name] = value;

		//trigger a change
		this.trigger("Change", old);
	}
});

Crafty.c("Physics", {
	_gravity: 0.4,
	_friction: 0.2,
	_bounce: 0.5,

	gravity: function (gravity) {
		this._gravity = gravity;
	}
});

/**@
* #Gravity
* @category 2D
* Adds gravitational pull to the entity.
* @trigger Hit - when the entity hits an entity that stops it from falling
*/
Crafty.c("Gravity", {
	_gravity: 0.2,
	_gy: 0,
	_falling: true,
	_anti: null,

	init: function () {
		this.requires("2D");
	},

	/**@
	* #.gravity
	* @comp Gravity
	* @sign public this .gravity([comp])
	* @param comp - The name of a component that will stop this entity from falling
	* Enamle gravity for this entity. If comp parameter is specified all entities with that component will stop this entity from falling.
	* For a player entity in a platform game this would be a component that is added to all entities
	* that the player should be able to walk on.
	* ~~~
	* Crafty.e("2D, DOM, Color, Gravity").color("red").attr({ w: 100, h: 100 }).gravity("platform")
	* ~~~
	*/
	gravity: function (comp) {
		if (comp) this._anti = comp;

		this.bind("EnterFrame", this._enterframe);

		return this;
	},

	_enterframe: function () {
		if (this._falling) {
			//if falling, move the players Y
			this._gy += this._gravity * 2;
			this.y += this._gy;
		} else {
			this._gy = 0; //reset change in y
		}

		var obj, hit = false, pos = this.pos(),
			q, i = 0, l;

		//Increase by 1 to make sure map.search() finds the floor
		pos._y++;

		//map.search wants _x and intersect wants x...
		pos.x = pos._x;
		pos.y = pos._y;
		pos.w = pos._w;
		pos.h = pos._h;

		q = Crafty.map.search(pos);
		l = q.length;

		for (; i < l; ++i) {
			obj = q[i];
			//check for an intersection directly below the player
			if (obj !== this && obj.has(this._anti) && obj.intersect(pos)) {
				hit = obj;
				break;
			}
		}

		if (hit) { //stop falling if found
			if (this._falling) this.stopFalling(hit);
		} else {
			this._falling = true; //keep falling otherwise
		}
	},

	stopFalling: function (e) {
		if (e) this.y = e._y - this._h; //move object

		//this._gy = -1 * this._bounce;
		this._falling = false;
		if (this._up) this._up = false;
		this.trigger("Hit");
	},

	/**@
	* #.antigravity
	* @comp Gravity
	* @sign public this .antigravity()
	* Disable gravity for this component. It can be reenabled by calling .gravity()
	*/
	antigravity: function () {
		this.unbind("EnterFrame", this._enterframe);
	}
});

/**@
* #Crafty.Polygon
* @category 2D
* Polygon object used for hitboxes and click maps. Must pass an Array for each point as an
* argument where index 0 is the x position and index 1 is the y position.
*
* For example one point of a polygon will look like this: `[0,5]` where the `x` is `0` and the `y` is `5`.
*
* Can pass an array of the points or simply put each point as an argument.
*
* When creating a polygon for an entity, each point should be offset or relative from the entities `x` and `y`
* (don't include the absolute values as it will automatically calculate this).
*
*
* @example
* ~~~
* new Crafty.polygon([50,0],[100,100],[0,100]);
* ~~~
*/
Crafty.polygon = function (poly) {
	if (arguments.length > 1) {
		poly = Array.prototype.slice.call(arguments, 0);
	}
	this.points = poly;
};

Crafty.polygon.prototype = {
/**@
	* #.containsPoint
	* @comp Crafty.Polygon
	* @sign public Boolean .containsPoint(Number x, Number y)
	* @param x - X position of the point
	* @param y - Y position of the point
	* Method is used to determine if a given point is contained by the polygon.
	* @example
	* ~~~
	* var poly = new Crafty.polygon([50,0],[100,100],[0,100]);
	* poly.containsPoint(50, 50); //TRUE
	* poly.containsPoint(0, 0); //FALSE
	* ~~~
	*/
	containsPoint: function (x, y) {
		var p = this.points, i, j, c = false;

		for (i = 0, j = p.length - 1; i < p.length; j = i++) {
			if (((p[i][1] > y) != (p[j][1] > y)) && (x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0])) {
				c = !c;
			}
		}

		return c;
	},

	/**@
	* #.shift
	* @comp Crafty.Polygon
	* @sign public void .shift(Number x, Number y)
	* @param x - Amount to shift the `x` axis
	* @param y - Amount to shift the `y` axis
	* Shifts every single point in the polygon by the specified amount.
	* @example
	* ~~~
	* var poly = new Crafty.polygon([50,0],[100,100],[0,100]);
	* poly.shift(5,5);
	* //[[55,5], [105,5], [5,105]];
	* ~~~
	*/
	shift: function (x, y) {
		var i = 0, l = this.points.length, current;
		for (; i < l; i++) {
			current = this.points[i];
			current[0] += x;
			current[1] += y;
		}
	},

	rotate: function (e) {
		var i = 0, l = this.points.length,
			current, x, y;

		for (; i < l; i++) {
			current = this.points[i];

			x = e.o.x + (current[0] - e.o.x) * e.cos + (current[1] - e.o.y) * e.sin;
			y = e.o.y - (current[0] - e.o.x) * e.sin + (current[1] - e.o.y) * e.cos;

			current[0] = x;
			current[1] = y;
		}
	}
};

/**@
* #Crafty.Circle
* @category 2D
* Circle object used for hitboxes and click maps. Must pass a `x`, a `y` and a `radius` value.
*
* ~~~
* var centerX = 5,
*     centerY = 10,
*     radius = 25;
*
* new Crafty.circle(centerX, centerY, radius);
* ~~~
*
* When creating a circle for an entity, each point should be offset or relative from the entities `x` and `y`
* (don't include the absolute values as it will automatically calculate this).
*/
Crafty.circle = function (x, y, radius) {
	this.x = x;
	this.y = y;
	this.radius = radius;

	// Creates an octogon that aproximate the circle for backward compatibility.
	this.points = [];
	var theta;

	for (var i = 0; i < 8; i++) {
		theta = i * Math.PI / 4;
		this.points[i] = [Math.sin(theta) * radius, Math.cos(theta) * radius];
	}
};

Crafty.circle.prototype = {
/**@
	* #.containsPoint
	* @comp Crafty.Circle
	* @sign public Boolean .containsPoint(Number x, Number y)
	* @param x - X position of the point
	* @param y - Y position of the point
	* Method is used to determine if a given point is contained by the circle.
	* @example
	* ~~~
	* var circle = new Crafty.circle(0, 0, 10);
	* circle.containsPoint(0, 0); //TRUE
	* circle.containsPoint(50, 50); //FALSE
	* ~~~
	*/
	containsPoint: function (x, y) {
		var radius = this.radius,
		    sqrt = Math.sqrt,
		    deltaX = this.x - x,
		    deltaY = this.y - y;

		return (deltaX * deltaX + deltaY * deltaY) < (radius * radius);
	},

	/**@
	* #.shift
	* @comp Crafty.Circle
	* @sign public void .shift(Number x, Number y)
	* @param x - Amount to shift the `x` axis
	* @param y - Amount to shift the `y` axis
	* Shifts the circle by the specified amount.
	* @example
	* ~~~
	* var poly = new Crafty.circle(0, 0, 10);
	* circle.shift(5,5);
	* //{x: 5, y: 5, radius: 10};
	* ~~~
	*/
	shift: function (x, y) {
		this.x += x;
		this.y += y;

		var i = 0, l = this.points.length, current;
		for (; i < l; i++) {
			current = this.points[i];
			current[0] += x;
			current[1] += y;
		}
	},

	rotate: function () {
		// We are a circle, we don't have to rotate :)
	}
};


Crafty.matrix = function (m) {
	this.mtx = m;
	this.width = m[0].length;
	this.height = m.length;
};

Crafty.matrix.prototype = {
	x: function (other) {
		if (this.width != other.height) {
			return;
		}

		var result = [];
		for (var i = 0; i < this.height; i++) {
			result[i] = [];
			for (var j = 0; j < other.width; j++) {
				var sum = 0;
				for (var k = 0; k < this.width; k++) {
					sum += this.mtx[i][k] * other.mtx[k][j];
				}
				result[i][j] = sum;
			}
		}
		return new Crafty.matrix(result);
	},


	e: function (row, col) {
		//test if out of bounds
		if (row < 1 || row > this.mtx.length || col < 1 || col > this.mtx[0].length) return null;
		return this.mtx[row - 1][col - 1];
	}
}
 /**@
* #Collision
* @category 2D
* Component to detect collision between any two convex polygons.
*/
Crafty.c("Collision", {

	init: function () {
		this.requires("2D");
	},

	/**@
	* #.collision
	* @comp Collision
	* @sign public this .collision([Crafty.Polygon polygon])
	* @param polygon - Crafty.Polygon object that will act as the hit area
	* Constructor takes a polygon to use as the hit area. If left empty,
	* will create a rectangle polygon based on the x, y, w, h dimensions.
	*
	* This must be called before any .hit() or .onhit() methods.
	*
	* The hit area (polygon) must be a convex shape and not concave
	* for the collision detection to work.
	* @example
	* ~~~
	* Crafty.e("2D, Collision").collision(
	*     new Crafty.polygon([50,0], [100,100], [0,100])
	* );
	* ~~~
	* @see Crafty.Polygon
	*/
	collision: function (poly) {
		var area = this._mbr || this;

		//if no polygon presented, create a square
		if (!poly) {
			poly = new Crafty.polygon([0, 0], [area._w, 0], [area._w, area._h], [0, area._h]);
		}
		this.map = poly;
		this.attach(this.map);
		this.map.shift(area._x, area._y);

		return this;
	},

	/**@
	* #.hit
	* @comp Collision
	* @sign public Boolean/Array hit(String component)
	* @param component - Check collision with entities that has this component
	* @return `false` if no collision. If a collision is detected, returns an Array of objects that are colliding.
	* Takes an argument for a component to test collision for. If a collision is found, an array of
	* every object in collision along with the amount of overlap is passed.
	*
	* If no collision, will return false. The return collision data will be an Array of Objects with the
	* type of collision used, the object collided and if the type used was SAT (a polygon was used as the hitbox) then an amount of overlap.
	* ~~~
	* [{
	*    obj: [entity],
	*    type "MBR" or "SAT",
	*    overlap: [number]
	* }]
	* ~~~
	* `MBR` is your standard axis aligned rectangle intersection (`.intersect` in the 2D component).
	* `SAT` is collision between any convex polygon.
	* @see .onHit, 2D
	*/
	hit: function (comp) {
		var area = this._mbr || this,
			results = Crafty.map.search(area, false),
			i = 0, l = results.length,
			dupes = {},
			id, obj, oarea, key,
			hasMap = ('map' in this && 'containsPoint' in this.map),
			finalresult = [];

		if (!l) {
			return false;
		}

		for (; i < l; ++i) {
			obj = results[i];
			oarea = obj._mbr || obj; //use the mbr

			if (!obj) continue;
			id = obj[0];

			//check if not added to hash and that actually intersects
			if (!dupes[id] && this[0] !== id && obj.__c[comp] &&
							 oarea._x < area._x + area._w && oarea._x + oarea._w > area._x &&
							 oarea._y < area._y + area._h && oarea._h + oarea._y > area._y)
				dupes[id] = obj;
		}

		for (key in dupes) {
			obj = dupes[key];

			if (hasMap && 'map' in obj) {
				var SAT = this._SAT(this.map, obj.map);
				SAT.obj = obj;
				SAT.type = "SAT";
				if (SAT) finalresult.push(SAT);
			} else {
				finalresult.push({ obj: obj, type: "MBR" });
			}
		}

		if (!finalresult.length) {
			return false;
		}

		return finalresult;
	},

	/**@
	* #.onHit
	* @comp Collision
	* @sign public this .onHit(String component, Function hit[, Function noHit])
	* @param component - Component to check collisions for
	* @param hit - Callback method to execute when collided with component
	* @param noHit - Callback method executed once as soon as collision stops
	* Creates an enterframe event calling .hit() each time and if collision detected will invoke the callback.
	* @see .hit
	*/
	onHit: function (comp, fn, fnOff) {
		var justHit = false;
		this.bind("EnterFrame", function () {
			var hitdata = this.hit(comp);
			if (hitdata) {
				justHit = true;
				fn.call(this, hitdata);
			} else if (justHit) {
				if (typeof fnOff == 'function') {
					fnOff.call(this);
				}
				justHit = false;
			}
		});
		return this;
	},

	_SAT: function (poly1, poly2) {
		var points1 = poly1.points,
			points2 = poly2.points,
			i = 0, l = points1.length,
			j, k = points2.length,
			normal = { x: 0, y: 0 },
			length,
			min1, min2,
			max1, max2,
			interval,
			MTV = null,
			MTV2 = null,
			MN = null,
			dot,
			nextPoint,
			currentPoint;

		//loop through the edges of Polygon 1
		for (; i < l; i++) {
			nextPoint = points1[(i == l - 1 ? 0 : i + 1)];
			currentPoint = points1[i];

			//generate the normal for the current edge
			normal.x = -(nextPoint[1] - currentPoint[1]);
			normal.y = (nextPoint[0] - currentPoint[0]);

			//normalize the vector
			length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
			normal.x /= length;
			normal.y /= length;

			//default min max
			min1 = min2 = -1;
			max1 = max2 = -1;

			//project all vertices from poly1 onto axis
			for (j = 0; j < l; ++j) {
				dot = points1[j][0] * normal.x + points1[j][1] * normal.y;
				if (dot > max1 || max1 === -1) max1 = dot;
				if (dot < min1 || min1 === -1) min1 = dot;
			}

			//project all vertices from poly2 onto axis
			for (j = 0; j < k; ++j) {
				dot = points2[j][0] * normal.x + points2[j][1] * normal.y;
				if (dot > max2 || max2 === -1) max2 = dot;
				if (dot < min2 || min2 === -1) min2 = dot;
			}

			//calculate the minimum translation vector should be negative
			if (min1 < min2) {
				interval = min2 - max1;

				normal.x = -normal.x;
				normal.y = -normal.y;
			} else {
				interval = min1 - max2;
			}

			//exit early if positive
			if (interval >= 0) {
				return false;
			}

			if (MTV === null || interval > MTV) {
				MTV = interval;
				MN = { x: normal.x, y: normal.y };
			}
		}

		//loop through the edges of Polygon 2
		for (i = 0; i < k; i++) {
			nextPoint = points2[(i == k - 1 ? 0 : i + 1)];
			currentPoint = points2[i];

			//generate the normal for the current edge
			normal.x = -(nextPoint[1] - currentPoint[1]);
			normal.y = (nextPoint[0] - currentPoint[0]);

			//normalize the vector
			length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
			normal.x /= length;
			normal.y /= length;

			//default min max
			min1 = min2 = -1;
			max1 = max2 = -1;

			//project all vertices from poly1 onto axis
			for (j = 0; j < l; ++j) {
				dot = points1[j][0] * normal.x + points1[j][1] * normal.y;
				if (dot > max1 || max1 === -1) max1 = dot;
				if (dot < min1 || min1 === -1) min1 = dot;
			}

			//project all vertices from poly2 onto axis
			for (j = 0; j < k; ++j) {
				dot = points2[j][0] * normal.x + points2[j][1] * normal.y;
				if (dot > max2 || max2 === -1) max2 = dot;
				if (dot < min2 || min2 === -1) min2 = dot;
			}

			//calculate the minimum translation vector should be negative
			if (min1 < min2) {
				interval = min2 - max1;

				normal.x = -normal.x;
				normal.y = -normal.y;
			} else {
				interval = min1 - max2;


			}

			//exit early if positive
			if (interval >= 0) {
				return false;
			}

			if (MTV === null || interval > MTV) MTV = interval;
			if (interval > MTV2 || MTV2 === null) {
				MTV2 = interval;
				MN = { x: normal.x, y: normal.y };
			}
		}

		return { overlap: MTV2, normal: MN };
	}
});
 /**@
* #DOM
* @category Graphics
* Draws entities as DOM nodes, specifically `<DIV>`s.
*/
Crafty.c("DOM", {
/**@
	* #._element
	* @comp DOM
	* The DOM element used to represent the entity.
	*/
	_element: null,

	init: function () {
		this._element = document.createElement("div");
		Crafty.stage.inner.appendChild(this._element);
		this._element.style.position = "absolute";
		this._element.id = "ent" + this[0];

		this.bind("Change", function () {
			if (!this._changed) {
				this._changed = true;
				Crafty.DrawManager.add(this);
			}
		});

		function updateClass() {
			var i = 0, c = this.__c, str = "";
			for (i in c) {
				str += ' ' + i;
			}
			str = str.substr(1);
			this._element.className = str;
		}

		this.bind("NewComponent", updateClass).bind("RemoveComponent", updateClass);

		if (Crafty.support.prefix === "ms" && Crafty.support.version < 9) {
			this._filters = {};

			this.bind("Rotate", function (e) {
				var m = e.matrix,
					elem = this._element.style,
					M11 = m.M11.toFixed(8),
					M12 = m.M12.toFixed(8),
					M21 = m.M21.toFixed(8),
					M22 = m.M22.toFixed(8);

				this._filters.rotation = "progid:DXImageTransform.Microsoft.Matrix(M11=" + M11 + ", M12=" + M12 + ", M21=" + M21 + ", M22=" + M22 + ",sizingMethod='auto expand')";
			});
		}

		this.bind("Remove", this.undraw);
	},

	/**@
	* #.DOM
	* @comp DOM
	* @trigger Draw - when the entity is ready to be drawn to the stage - { style:String, type:"DOM", co}
	* @sign public this .DOM(HTMLElement elem)
	* @param elem - HTML element that will replace the dynamically created one
	* Pass a DOM element to use rather than one created. Will set `._element` to this value. Removes the old element.
	*/
	DOM: function (elem) {
		if (elem && elem.nodeType) {
			this.undraw();
			this._element = elem;
			this._element.style.position = 'absolute';
		}
		return this;
	},

	/**@
	* #.draw
	* @comp DOM
	* @sign public this .draw(void)
	* Updates the CSS properties of the node to draw on the stage.
	*/
	draw: function () {
		var style = this._element.style,
			coord = this.__coord || [0, 0, 0, 0],
			co = { x: coord[0], y: coord[1] },
			prefix = Crafty.support.prefix,
			trans = [];

		if (!this._visible) style.visibility = "hidden";
		else style.visibility = "visible";

		//utilize CSS3 if supported
		if (Crafty.support.css3dtransform) {
			trans.push("translate3d(" + (~~this._x) + "px," + (~~this._y) + "px,0)");
		} else {
			style.left = ~~(this._x) + "px";
			style.top = ~~(this._y) + "px";
		}

		style.width = ~~(this._w) + "px";
		style.height = ~~(this._h) + "px";
		style.zIndex = this._z;

		style.opacity = this._alpha;
		style[prefix + "Opacity"] = this._alpha;

		//if not version 9 of IE
		if (prefix === "ms" && Crafty.support.version < 9) {
			//for IE version 8, use ImageTransform filter
			if (Crafty.support.version === 8) {
				this._filters.alpha = "progid:DXImageTransform.Microsoft.Alpha(Opacity=" + (this._alpha * 100) + ")"; // first!
				//all other versions use filter
			} else {
				this._filters.alpha = "alpha(opacity=" + (this._alpha * 100) + ")";
			}
		}

		if (this._mbr) {
			var origin = this._origin.x + "px " + this._origin.y + "px";
			style.transformOrigin = origin;
			style[prefix + "TransformOrigin"] = origin;
			if (Crafty.support.css3dtransform) trans.push("rotateZ(" + this._rotation + "deg)");
			else trans.push("rotate(" + this._rotation + "deg)");
		}

		if (this._flipX) {
			trans.push("scaleX(-1)");
			if (prefix === "ms" && Crafty.support.version < 9) {
				this._filters.flipX = "fliph";
			}
		}

		if (this._flipY) {
			trans.push("scaleY(-1)");
			if (prefix === "ms" && Crafty.support.version < 9) {
				this._filters.flipY = "flipv";
			}
		}

		//apply the filters if IE
		if (prefix === "ms" && Crafty.support.version < 9) {
			this.applyFilters();
		}

		style.transform = trans.join(" ");
		style[prefix + "Transform"] = trans.join(" ");

		this.trigger("Draw", { style: style, type: "DOM", co: co });

		return this;
	},

	applyFilters: function () {
		this._element.style.filter = "";
		var str = "";

		for (var filter in this._filters) {
			if (!this._filters.hasOwnProperty(filter)) continue;
			str += this._filters[filter] + " ";
		}

		this._element.style.filter = str;
	},

	/**@
	* #.undraw
	* @comp DOM
	* @sign public this .undraw(void)
	* Removes the element from the stage.
	*/
	undraw: function () {
		Crafty.stage.inner.removeChild(this._element);
		return this;
	},

	/**@
	* #.css
	* @comp DOM
	* @sign public * css(String property, String value)
	* @param property - CSS property to modify
	* @param value - Value to give the CSS property
	* @sign public * css(Object map)
	* @param map - Object where the key is the CSS property and the value is CSS value
	* Apply CSS styles to the element.
	*
	* Can pass an object where the key is the style property and the value is style value.
	*
	* For setting one style, simply pass the style as the first argument and the value as the second.
	*
	* The notation can be CSS or JS (e.g. `text-align` or `textAlign`).
	*
	* To return a value, pass the property.
	* @example
	* ~~~
	* this.css({'text-align', 'center', font: 'Arial'});
	* this.css("textAlign", "center");
	* this.css("text-align"); //returns center
	* ~~~
	*/
	css: function (obj, value) {
		var key,
			elem = this._element,
			val,
			style = elem.style;

		//if an object passed
		if (typeof obj === "object") {
			for (key in obj) {
				if (!obj.hasOwnProperty(key)) continue;
				val = obj[key];
				if (typeof val === "number") val += 'px';

				style[Crafty.DOM.camelize(key)] = val;
			}
		} else {
			//if a value is passed, set the property
			if (value) {
				if (typeof value === "number") value += 'px';
				style[Crafty.DOM.camelize(obj)] = value;
			} else { //otherwise return the computed property
				return Crafty.DOM.getStyle(elem, obj);
			}
		}

		this.trigger("Change");

		return this;
	}
});

/**
* Fix IE6 background flickering
*/
try {
	document.execCommand("BackgroundImageCache", false, true);
} catch (e) { }

Crafty.extend({
/**@
	* #Crafty.DOM
	* @category Graphics
	* Collection of utilities for using the DOM.
	*/
	DOM: {
	/**@
		* #Crafty.DOM.window
		* @comp Crafty.DOM
		* Object with `width` and `height` values representing the width
		* and height of the `window`.
		*/
		window: {
			init: function () {
				this.width = window.innerWidth || (window.document.documentElement.clientWidth || window.document.body.clientWidth);
				this.height = window.innerHeight || (window.document.documentElement.clientHeight || window.document.body.clientHeight);
			},

			width: 0,
			height: 0
		},

		/**@
		* #Crafty.DOM.inner
		* @comp Crafty.DOM
		* @sign public Object Crafty.DOM.inner(HTMLElement obj)
		* @param obj - HTML element to calculate the position
		* @returns Object with `x` key being the `x` position, `y` being the `y` position
		* Find a DOM elements position including
		* padding and border.
		*/
		inner: function (obj) {
			var rect = obj.getBoundingClientRect(),
				x = rect.left + (window.pageXOffset ? window.pageXOffset : document.body.scrollTop),
				y = rect.top + (window.pageYOffset ? window.pageYOffset : document.body.scrollLeft),

			//border left
				borderX = parseInt(this.getStyle(obj, 'border-left-width') || 0, 10) || parseInt(this.getStyle(obj, 'borderLeftWidth') || 0, 10) || 0,
				borderY = parseInt(this.getStyle(obj, 'border-top-width') || 0, 10) || parseInt(this.getStyle(obj, 'borderTopWidth') || 0, 10) || 0;

			x += borderX;
			y += borderY;

			return { x: x, y: y };
		},

		/**@
		* #Crafty.DOM.getStyle
		* @comp Crafty.DOM
		* @sign public Object Crafty.DOM.getStyle(HTMLElement obj, String property)
		* @param obj - HTML element to find the style
		* @param property - Style to return
		* Determine the value of a style on an HTML element. Notation can be
		* in either CSS or JS.
		*/
		getStyle: function (obj, prop) {
			var result;
			if (obj.currentStyle)
				result = obj.currentStyle[this.camelize(prop)];
			else if (window.getComputedStyle)
				result = document.defaultView.getComputedStyle(obj, null).getPropertyValue(this.csselize(prop));
			return result;
		},

		/**
		* Used in the Zepto framework
		*
		* Converts CSS notation to JS notation
		*/
		camelize: function (str) {
			return str.replace(/-+(.)?/g, function (match, chr){ return chr ? chr.toUpperCase() : '' });
		},

		/**
		* Converts JS notation to CSS notation
		*/
		csselize: function (str) {
			return str.replace(/[A-Z]/g, function (chr){ return chr ? '-' + chr.toLowerCase() : '' });
		},

		/**@
		* #Crafty.DOM.translate
		* @comp Crafty.DOM
		* @sign public Object Crafty.DOM.translate(Number x, Number y)
		* @param x - x position to translate
		* @param y - y position to translate
		* @return Object with x and y as keys and translated values
		*
		* Method will translate x and y positions to positions on the
		* stage. Useful for mouse events with `e.clientX` and `e.clientY`.
		*/
		translate: function (x, y) {
			return {
				x: x - Crafty.stage.x + document.body.scrollLeft + document.documentElement.scrollLeft - Crafty.viewport._x,
				y: y - Crafty.stage.y + document.body.scrollTop + document.documentElement.scrollTop - Crafty.viewport._y
			}
		}
	}
}); /**@
* #Crafty.support
* @category Misc, Core
* Determines feature support for what Crafty can do.
*/
(function testSupport() {
	var support = Crafty.support = {},
		ua = navigator.userAgent.toLowerCase(),
		match = /(webkit)[ \/]([\w.]+)/.exec(ua) ||
				/(o)pera(?:.*version)?[ \/]([\w.]+)/.exec(ua) ||
				/(ms)ie ([\w.]+)/.exec(ua) ||
				/(moz)illa(?:.*? rv:([\w.]+))?/.exec(ua) || [],
		mobile = /iPad|iPod|iPhone|Android|webOS/i.exec(ua);

	if (mobile) Crafty.mobile = mobile[0];

	/**@
	* #Crafty.support.setter
	* @comp Crafty.support
	* Is `__defineSetter__` supported?
	*/
	support.setter = ('__defineSetter__' in this && '__defineGetter__' in this);

	/**@
	* #Crafty.support.defineProperty
	* @comp Crafty.support
	* Is `Object.defineProperty` supported?
	*/
	support.defineProperty = (function () {
		if (!'defineProperty' in Object) return false;
		try { Object.defineProperty({}, 'x', {}); }
		catch (e) { return false };
		return true;
	})();

	/**@
	* #Crafty.support.audio
	* @comp Crafty.support
	* Is HTML5 `Audio` supported?
	*/
	support.audio = ('Audio' in window);

	/**@
	* #Crafty.support.prefix
	* @comp Crafty.support
	* Returns the browser specific prefix (`Moz`, `O`, `ms`, `webkit`).
	*/
	support.prefix = (match[1] || match[0]);

	//browser specific quirks
	if (support.prefix === "moz") support.prefix = "Moz";
	if (support.prefix === "o") support.prefix = "O";

	if (match[2]) {
		/**@
		* #Crafty.support.versionName
		* @comp Crafty.support
		* Version of the browser
		*/
		support.versionName = match[2];

		/**@
		* #Crafty.support.version
		* @comp Crafty.support
		* Version number of the browser as an Integer (first number)
		*/
		support.version = +(match[2].split("."))[0];
	}

	/**@
	* #Crafty.support.canvas
	* @comp Crafty.support
	* Is the `canvas` element supported?
	*/
	support.canvas = ('getContext' in document.createElement("canvas"));

	/**@
	* #Crafty.support.webgl
	* @comp Crafty.support
	* Is WebGL supported on the canvas element?
	*/
	if (support.canvas) {
		var gl;
		try {
			gl = document.createElement("canvas").getContext("experimental-webgl");
			gl.viewportWidth = canvas.width;
			gl.viewportHeight = canvas.height;
		}
		catch (e) { }
		support.webgl = !!gl;
	}
	else {
		support.webgl = false;
	}

	support.css3dtransform = (typeof document.createElement("div").style["Perspective"] !== "undefined")
							|| (typeof document.createElement("div").style[support.prefix + "Perspective"] !== "undefined");
})();
Crafty.extend({

	zeroFill: function (number, width) {
		width -= number.toString().length;
		if (width > 0)
			return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number;
		return number.toString();
	},

	/**@
	* #Crafty.sprite
	* @category Graphics
	* @sign public this Crafty.sprite([Number tile], String url, Object map[, Number paddingX[, Number paddingY]])
	* @param tile - Tile size of the sprite map, defaults to 1
	* @param url - URL of the sprite image
	* @param map - Object where the key is what becomes a new component and the value points to a position on the sprite map
	* @param paddingX - Horizontal space inbetween tiles. Defaults to 0.
	* @param paddingY - Vertical space inbetween tiles. Defaults to paddingX.
	* Generates components based on positions in a sprite image to be applied to entities.
	*
	* Accepts a tile size, URL and map for the name of the sprite and it's position.
	*
	* The position must be an array containing the position of the sprite where index `0`
	* is the `x` position, `1` is the `y` position and optionally `2` is the width and `3`
	* is the height. If the sprite map has padding, pass the values for the `x` padding
	* or `y` padding. If they are the same, just add one value.
	*
	* If the sprite image has no consistent tile size, `1` or no argument need be
	* passed for tile size.
	*
	* Entities that add the generated components are also given a component called `Sprite`.
	* @see Sprite
	*/
	sprite: function (tile, tileh, url, map, paddingX, paddingY) {
		var pos, temp, x, y, w, h, img;

		//if no tile value, default to 1
		if (typeof tile === "string") {
			paddingY = paddingX;
			paddingX = map;
			map = tileh;
			url = tile;
			tile = 1;
			tileh = 1;
		}

		if (typeof tileh == "string") {
			paddingY = paddingX;
			paddingX = map;
			map = url;
			url = tileh;
			tileh = tile;
		}

		//if no paddingY, use paddingX
		if (!paddingY && paddingX) paddingY = paddingX;
		paddingX = parseInt(paddingX || 0, 10); //just incase
		paddingY = parseInt(paddingY || 0, 10);

		img = Crafty.assets[url];
		if (!img) {
			img = new Image();
			img.src = url;
			Crafty.assets[url] = img;
			img.onload = function () {
				//all components with this img are now ready
				for (var pos in map) {
					Crafty(pos).each(function () {
						this.ready = true;
						this.trigger("Change");
					});
				}
			};
		}

		for (pos in map) {
			if (!map.hasOwnProperty(pos)) continue;

			temp = map[pos];
			x = temp[0] * (tile + paddingX);
			y = temp[1] * (tileh + paddingY);
			w = temp[2] * tile || tile;
			h = temp[3] * tileh || tileh;

			//generates sprite components for each tile in the map
			Crafty.c(pos, {
				ready: false,
				__coord: [x, y, w, h],

				init: function () {
					this.requires("Sprite");
					this.__trim = [0, 0, 0, 0];
					this.__image = url;
					this.__coord = [this.__coord[0], this.__coord[1], this.__coord[2], this.__coord[3]];
					this.__tile = tile;
					this.__tileh = tileh;
					this.__padding = [paddingX, paddingY];
					this.img = img;

					//draw now
					if (this.img.complete && this.img.width > 0) {
						this.ready = true;
						this.trigger("Change");
					}

					//set the width and height to the sprite size
					this.w = this.__coord[2];
					this.h = this.__coord[3];
				}
			});
		}

		return this;
	},

	_events: {},

	/**@
	* #Crafty.addEvent
	* @category Events, Misc
	* @sign public this Crafty.addEvent(Object ctx, HTMLElement obj, String event, Function callback)
	* @param ctx - Context of the callback or the value of `this`
	* @param obj - Element to add the DOM event to
	* @param event - Event name to bind to
	* @param callback - Method to execute when triggered
	* Adds DOM level 3 events to elements. The arguments it accepts are the call
	* context (the value of `this`), the DOM element to attach the event to,
	* the event name (without `on` (`click` rather than `onclick`)) and
	* finally the callback method.
	*
	* If no element is passed, the default element will be `window.document`.
	*
	* Callbacks are passed with event data.
	* @see Crafty.removeEvent
	*/
	addEvent: function (ctx, obj, type, fn) {
		if (arguments.length === 3) {
			fn = type;
			type = obj;
			obj = window.document;
		}

		//save anonymous function to be able to remove
		var afn = function (e) { var e = e || window.event; fn.call(ctx, e) },
			id = ctx[0] || "";

		if (!this._events[id + obj + type + fn]) this._events[id + obj + type + fn] = afn;
		else return;

		if (obj.attachEvent) { //IE
			obj.attachEvent('on' + type, afn);
		} else { //Everyone else
			obj.addEventListener(type, afn, false);
		}
	},

	/**@
	* #Crafty.removeEvent
	* @category Events, Misc
	* @sign public this Crafty.removeEvent(Object ctx, HTMLElement obj, String event, Function callback)
	* @param ctx - Context of the callback or the value of `this`
	* @param obj - Element the event is on
	* @param event - Name of the event
	* @param callback - Method executed when triggered
	* Removes events attached by `Crafty.addEvent()`. All parameters must
	* be the same that were used to attach the event including a reference
	* to the callback method.
	* @see Crafty.addEvent
	*/
	removeEvent: function (ctx, obj, type, fn) {
		if (arguments.length === 3) {
			fn = type;
			type = obj;
			obj = window.document;
		}

		//retrieve anonymouse function
		var id = ctx[0] || "",
			afn = this._events[id + obj + type + fn];

		if (afn) {
			if (obj.detachEvent) {
				obj.detachEvent('on' + type, afn);
			} else obj.removeEventListener(type, afn, false);
			delete this._events[id + obj + type + fn];
		}
	},

	/**@
	* #Crafty.background
	* @category Graphics, Stage
	* @sign public void Crafty.background(String value)
	* @param color - Modify the background with a color or image
	* This method is essentially a shortcut for adding a background
	* style to the stage element.
	*/
	background: function (color) {
		Crafty.stage.elem.style.background = color;
	},

	/**@
	* #Crafty.viewport
	* @category Stage
	* Viewport is essentially a 2D camera looking at the stage. Can be moved which
	* in turn will react just like a camera moving in that direction.
	*/
	viewport: {
	/**@
		* #Crafty.viewport.clampToEntities
		* @comp Crafty.viewport
		* Decides if the viewport functions should clamp to game entities.
		* When set to `true` functions such as Crafty.viewport.mouselook() will not allow you to move the
		* viewport over areas of the game that has no entities.
		* For development it can be useful to set this to false.
		*/
		clampToEntities: true,
		width: 0,
		height: 0,
		/**@
		* #Crafty.viewport.x
		* @comp Crafty.viewport
		* Will move the stage and therefore every visible entity along the `x`
		* axis in the opposite direction.
		*
		* When this value is set, it will shift the entire stage. This means that entity
		* positions are not exactly where they are on screen. To get the exact position,
		* simply add `Crafty.viewport.x` onto the entities `x` position.
		*/
		_x: 0,
		/**@
		* #Crafty.viewport.y
		* @comp Crafty.viewport
		* Will move the stage and therefore every visible entity along the `y`
		* axis in the opposite direction.
		*
		* When this value is set, it will shift the entire stage. This means that entity
		* positions are not exactly where they are on screen. To get the exact position,
		* simply add `Crafty.viewport.y` onto the entities `y` position.
		*/
		_y: 0,

		/**@
		 * #Crafty.viewport.scroll
		 * @comp Crafty.viewport
		 * @sign Crafty.viewport.scroll(String axis, Number v)
		 * @param axis - 'x' or 'y'
		 * @param v - The new absolute position on the axis
		 *
		 * Will move the viewport to the position given on the specified axis
		 * @example Crafty.viewport.scroll('_x', 500);
		 * Will move the camera 500 pixels right of its initial position, in effect
		 * shifting everything in the viewport 500 pixels to the left.
		 */
		scroll: function (axis, v) {
			var change = Math.floor(v - this[axis]), //change in direction
				context = Crafty.canvas.context,
				style = Crafty.stage.inner.style,
				canvas;

			//update viewport and DOM scroll
			this[axis] = v;
			if (axis == '_x') {
				if (context) context.translate(change, 0);
			} else {
				if (context) context.translate(0, change);
			}
			if (context) Crafty.DrawManager.drawAll();
			style[axis == '_x' ? "left" : "top"] = Math.round(~~v) + "px";
		},

		rect: function () {
			return { _x: -this._x, _y: -this._y, _w: this.width, _h: this.height };
		},

		/**
		 * #Crafty.viewport.pan
		 * @comp Crafty.viewport
		 * @sign public void Crafty.viewport.pan(String axis, Number v, Number time)
		 * @param String axis - 'x' or 'y'. The axis to move the camera on
		 * @param Number v - the distance to move the camera by
		 * @param Number time - The duration in frames for the entire camera movement
		 *
		 * Pans the camera a given number of pixels over a given number of frames
		 */
		pan: (function () {
			var tweens = {}, i, bound = false;

			function enterFrame(e) {
				var l = 0;
				for (i in tweens) {
					var prop = tweens[i];
					if (prop.remTime > 0) {
						prop.current += prop.diff;
						prop.remTime--;
						Crafty.viewport[i] = Math.floor(prop.current);
						l++;
					}
					else {
						delete tweens[i];
					}
				}
				if (l) Crafty.viewport._clamp();
			}

			return function (axis, v, time) {
				Crafty.viewport.follow();
				if (axis == 'reset') {
					for (i in tweens) {
						tweens[i].remTime = 0;
					}
					return;
				}
				if (time == 0) time = 1;
				tweens[axis] = {
					diff: -v / time,
					current: Crafty.viewport[axis],
					remTime: time
				};
				if (!bound) {
					Crafty.bind("EnterFrame", enterFrame);
					bound = true;
				}
			}
		})(),

		/**
		 * #Crafty.viewport.follow
		 * @comp Crafty.viewport
		 * @sign public void Crafty.viewport.follow(Object target, Number offsetx, Number offsety)
		 * @param Object target - An entity with the 2D component
		 * @param Number offsetx - Follow target should be offsetx pixels away from center
		 * @param Number offsety - Positive puts targ to the right of center
		 *
		 * Follows a given entity with the 2D component. If following target will take a portion of
		 * the viewport out of bounds of the world, following will stop until the target moves away.
		 * @example
		 * var ent = Crafty.e('2D, DOM').attr({w: 100, h: 100:});
		 * Crafty.viewport.follow(ent, 0, 0);
		 */
		follow: (function () {
			var oldTarget, offx, offy;

			function change() {
				Crafty.viewport.scroll('_x', -(this.x + (this.w / 2) - (Crafty.viewport.width / 2) - offx));
				Crafty.viewport.scroll('_y', -(this.y + (this.h / 2) - (Crafty.viewport.height / 2) - offy));
				Crafty.viewport._clamp();
			}

			return function (target, offsetx, offsety) {
				if (oldTarget)
					oldTarget.unbind('Change', change);
				if (!target || !target.has('2D'))
					return;
				Crafty.viewport.pan('reset');

				oldTarget = target;
				offx = (typeof offsetx != 'undefined') ? offsetx : 0;
				offy = (typeof offsety != 'undefined') ? offsety : 0;

				target.bind('Change', change);
				change.call(target);
			}
		})(),

		/**
		 * #Crafty.viewport.centerOn
		 * @comp Crafty.viewport
		 * @sign public void Crafty.viewport.centerOn(Object target, Number time)
		 * @param Object target - An entity with the 2D component
		 * @param Number time - The number of frames to perform the centering over
		 *
		 * Centers the viewport on the given entity
		 */
		centerOn: function (targ, time) {
			var x = targ.x,
					y = targ.y,
					mid_x = targ.w / 2,
					mid_y = targ.h / 2,
					cent_x = Crafty.viewport.width / 2,
					cent_y = Crafty.viewport.height / 2,
					new_x = x + mid_x - cent_x,
					new_y = y + mid_y - cent_y;

			Crafty.viewport.pan('reset');
			Crafty.viewport.pan('x', new_x, time);
			Crafty.viewport.pan('y', new_y, time);
		},

		/**
		 * #Crafty.viewport.zoom
		 * @comp Crafty.viewport
		 * @sign public void Crafty.viewport.zoom(Number amt, Number cent_x, Number cent_y, Number time)
		 * @param Number amt - amount to zoom in on the target by (eg. 2, 4, 0.5)
		 * @param Number cent_x - the center to zoom on
		 * @param Number cent_y - the center to zoom on
		 * @param Number time - the duration in frames of the entire zoom operation
		 *
		 * Zooms the camera in on a given point. amt > 1 will bring the camera closer to the subject
		 * amt < 1 will bring it farther away. amt = 0 will do nothing.
		 * Zooming is multiplicative. To reset the zoom amount, pass 0.
		 */
		zoom: (function () {
			var zoom = 1,
				zoom_tick = 0,
				dur = 0,
				prop = Crafty.support.prefix + "Transform",
				bound = false,
				act = {},
				prct = {};
			// what's going on:
			// 1. Get the original point as a percentage of the stage
			// 2. Scale the stage
			// 3. Get the new size of the stage
			// 4. Get the absolute position of our point using previous percentage
			// 4. Offset inner by that much

			function enterFrame() {
				if (dur > 0) {
					var old = {
						width: act.width * zoom,
						height: act.height * zoom
					};
					zoom += zoom_tick;
					var new_s = {
						width: act.width * zoom,
						height: act.height * zoom
					},
					diff = {
						width: new_s.width - old.width,
						height: new_s.height - old.height
					};
					Crafty.stage.inner.style[prop] = 'scale(' + zoom + ',' + zoom + ')';
					Crafty.viewport.x -= diff.width * prct.width;
					Crafty.viewport.y -= diff.height * prct.height;
					dur--;
				}
			}

			return function (amt, cent_x, cent_y, time) {
				var bounds = Crafty.map.boundaries(),
					final_zoom = amt ? zoom * amt : 1;

				act.width = bounds.max.x - bounds.min.x;
				act.height = bounds.max.y - bounds.min.y;

				prct.width = cent_x / act.width;
				prct.height = cent_y / act.height;

				if (time == 0) time = 1;
				zoom_tick = (final_zoom - zoom) / time;
				dur = time;

				Crafty.viewport.pan('reset');
				if (!bound) {
					Crafty.bind('EnterFrame', enterFrame);
					bound = true;
				}
			}
		})(),

		/**
		 * #Crafty.viewport.mouselook
		 * @comp Crafty.viewport
		 * @sign public void Crafty.viewport.mouselook(Boolean active)
		 * @param Boolean active - Activate or deactivate mouselook
		 *
		 * Toggle mouselook on the current viewport.
		 * Simply call this function and the user will be able to
		 * drag the viewport around.
		 */
		mouselook: (function () {
			var active = false,
				dragging = false,
				lastMouse = {}
			old = {};


			return function (op, arg) {
				if (typeof op == 'boolean') {
					active = op;
					if (active) {
						Crafty.mouseObjs++;
					}
					else {
						Crafty.mouseObjs = Math.max(0, Crafty.mouseObjs - 1);
					}
					return;
				}
				if (!active) return;
				switch (op) {
					case 'move':
					case 'drag':
						if (!dragging) return;
						diff = {
							x: arg.clientX - lastMouse.x,
							y: arg.clientY - lastMouse.y
						};

						Crafty.viewport.x += diff.x;
						Crafty.viewport.y += diff.y;
						Crafty.viewport._clamp();
					case 'start':
						lastMouse.x = arg.clientX;
						lastMouse.y = arg.clientY;
						dragging = true;
						break;
					case 'stop':
						dragging = false;
						break;
				}
			};
		})(),

		_clamp: function () {
			// clamps the viewport to the viewable area
			// under no circumstances should the viewport see something outside the boundary of the 'world'
			if (!this.clampToEntities) return;
			var bound = Crafty.map.boundaries();
			if (bound.max.x - bound.min.x > Crafty.viewport.width) {
				bound.max.x -= Crafty.viewport.width;

				if (Crafty.viewport.x < -bound.max.x) {
					Crafty.viewport.x = -bound.max.x;
				}
				else if (Crafty.viewport.x > -bound.min.x) {
					Crafty.viewport.x = -bound.min.x;
				}
			}
			else {
				Crafty.viewport.x = -1 * (bound.min.x + (bound.max.x - bound.min.x) / 2 - Crafty.viewport.width / 2);
			}
			if (bound.max.y - bound.min.y > Crafty.viewport.height) {
				bound.max.y -= Crafty.viewport.height;

				if (Crafty.viewport.y < -bound.max.y) {
					Crafty.viewport.y = -bound.max.y;
				}
				else if (Crafty.viewport.y > -bound.min.y) {
					Crafty.viewport.y = -bound.min.y;
				}
			}
			else {
				Crafty.viewport.y = -1 * (bound.min.y + (bound.max.y - bound.min.y) / 2 - Crafty.viewport.height / 2);
			}
		},

		init: function (w, h) {
			Crafty.DOM.window.init();

			//fullscreen if mobile or not specified
			this.width = (!w || Crafty.mobile) ? Crafty.DOM.window.width : w;
			this.height = (!h || Crafty.mobile) ? Crafty.DOM.window.height : h;

			//check if stage exists
			var crstage = document.getElementById("cr-stage");

			//create stage div to contain everything
			Crafty.stage = {
				x: 0,
				y: 0,
				fullscreen: false,
				elem: (crstage ? crstage : document.createElement("div")),
				inner: document.createElement("div")
			};

			//fullscreen, stop scrollbars
			if ((!w && !h) || Crafty.mobile) {
				document.body.style.overflow = "hidden";
				Crafty.stage.fullscreen = true;
			}

			Crafty.addEvent(this, window, "resize", function () {
				Crafty.DOM.window.init();
				var w = Crafty.DOM.window.width,
					h = Crafty.DOM.window.height,
					offset;


				if (Crafty.stage.fullscreen) {
					this.width = w;
					this.height = h;
					Crafty.stage.elem.style.width = w + "px";
					Crafty.stage.elem.style.height = h + "px";

					if (Crafty.canvas._canvas) {
						Crafty.canvas._canvas.width = w;
						Crafty.canvas._canvas.height = h;
						Crafty.DrawManager.drawAll();
					}
				}

				offset = Crafty.DOM.inner(Crafty.stage.elem);
				Crafty.stage.x = offset.x;
				Crafty.stage.y = offset.y;
			});

			Crafty.addEvent(this, window, "blur", function () {
				if (Crafty.settings.get("autoPause")) {
					Crafty.pause();
				}
			});
			Crafty.addEvent(this, window, "focus", function () {
				if (Crafty._paused && Crafty.settings.get("autoPause")) {
					Crafty.pause();
				}
			});

			//make the stage unselectable
			Crafty.settings.register("stageSelectable", function (v) {
				Crafty.stage.elem.onselectstart = v ? function () { return true; } : function () { return false; };
			});
			Crafty.settings.modify("stageSelectable", false);

			//make the stage have no context menu
			Crafty.settings.register("stageContextMenu", function (v) {
				Crafty.stage.elem.oncontextmenu = v ? function () { return true; } : function () { return false; };
			});
			Crafty.settings.modify("stageContextMenu", false);

			Crafty.settings.register("autoPause", function (){ });
			Crafty.settings.modify("autoPause", false);

			//add to the body and give it an ID if not exists
			if (!crstage) {
				document.body.appendChild(Crafty.stage.elem);
				Crafty.stage.elem.id = "cr-stage";
			}

			var elem = Crafty.stage.elem.style,
				offset;

			Crafty.stage.elem.appendChild(Crafty.stage.inner);
			Crafty.stage.inner.style.position = "absolute";
			Crafty.stage.inner.style.zIndex = "1";

			//css style
			elem.width = this.width + "px";
			elem.height = this.height + "px";
			elem.overflow = "hidden";

			if (Crafty.mobile) {
				elem.position = "absolute";
				elem.left = "0px";
				elem.top = "0px";

				var meta = document.createElement("meta"),
					head = document.getElementsByTagName("HEAD")[0];

				//stop mobile zooming and scrolling
				meta.setAttribute("name", "viewport");
				meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no");
				head.appendChild(meta);

				//hide the address bar
				meta = document.createElement("meta");
				meta.setAttribute("name", "apple-mobile-web-app-capable");
				meta.setAttribute("content", "yes");
				head.appendChild(meta);
				setTimeout(function () { window.scrollTo(0, 1); }, 0);

				Crafty.addEvent(this, window, "touchmove", function (e) {
					e.preventDefault();
				});

				Crafty.stage.x = 0;
				Crafty.stage.y = 0;

			} else {
				elem.position = "relative";
				//find out the offset position of the stage
				offset = Crafty.DOM.inner(Crafty.stage.elem);
				Crafty.stage.x = offset.x;
				Crafty.stage.y = offset.y;
			}

			if (Crafty.support.setter) {
				//define getters and setters to scroll the viewport
				this.__defineSetter__('x', function (v) { this.scroll('_x', v); });
				this.__defineSetter__('y', function (v) { this.scroll('_y', v); });
				this.__defineGetter__('x', function () { return this._x; });
				this.__defineGetter__('y', function () { return this._y; });
				//IE9
			} else if (Crafty.support.defineProperty) {
				Object.defineProperty(this, 'x', { set: function (v) { this.scroll('_x', v); }, get: function () { return this._x; } });
				Object.defineProperty(this, 'y', { set: function (v) { this.scroll('_y', v); }, get: function () { return this._y; } });
			} else {
				//create empty entity waiting for enterframe
				this.x = this._x;
				this.y = this._y;
				Crafty.e("viewport");
			}
		}
	},

	/**@
	* #Crafty.keys
	* @category Input
	* Object of key names and the corresponding key code.
	* ~~~
	* BACKSPACE: 8,
    * TAB: 9,
    * ENTER: 13,
    * PAUSE: 19,
    * CAPS: 20,
    * ESC: 27,
    * SPACE: 32,
    * PAGE_UP: 33,
    * PAGE_DOWN: 34,
    * END: 35,
    * HOME: 36,
    * LEFT_ARROW: 37,
    * UP_ARROW: 38,
    * RIGHT_ARROW: 39,
    * DOWN_ARROW: 40,
    * INSERT: 45,
    * DELETE: 46,
    * 0: 48,
    * 1: 49,
    * 2: 50,
    * 3: 51,
    * 4: 52,
    * 5: 53,
    * 6: 54,
    * 7: 55,
    * 8: 56,
    * 9: 57,
    * A: 65,
    * B: 66,
    * C: 67,
    * D: 68,
    * E: 69,
    * F: 70,
    * G: 71,
    * H: 72,
    * I: 73,
    * J: 74,
    * K: 75,
    * L: 76,
    * M: 77,
    * N: 78,
    * O: 79,
    * P: 80,
    * Q: 81,
    * R: 82,
    * S: 83,
    * T: 84,
    * U: 85,
    * V: 86,
    * W: 87,
    * X: 88,
    * Y: 89,
    * Z: 90,
    * NUMPAD_0: 96,
    * NUMPAD_1: 97,
    * NUMPAD_2: 98,
    * NUMPAD_3: 99,
    * NUMPAD_4: 100,
    * NUMPAD_5: 101,
    * NUMPAD_6: 102,
    * NUMPAD_7: 103,
    * NUMPAD_8: 104,
    * NUMPAD_9: 105,
    * MULTIPLY: 106,
    * ADD: 107,
    * SUBSTRACT: 109,
    * DECIMAL: 110,
    * DIVIDE: 111,
    * F1: 112,
    * F2: 113,
    * F3: 114,
    * F4: 115,
    * F5: 116,
    * F6: 117,
    * F7: 118,
    * F8: 119,
    * F9: 120,
    * F10: 121,
    * F11: 122,
    * F12: 123,
    * SHIFT: 16,
    * CTRL: 17,
    * ALT: 18,
    * PLUS: 187,
    * COMMA: 188,
    * MINUS: 189,
    * PERIOD: 190
	* ~~~
	*/
	keys: {
		'BACKSPACE': 8,
		'TAB': 9,
		'ENTER': 13,
		'PAUSE': 19,
		'CAPS': 20,
		'ESC': 27,
		'SPACE': 32,
		'PAGE_UP': 33,
		'PAGE_DOWN': 34,
		'END': 35,
		'HOME': 36,
		'LEFT_ARROW': 37,
		'UP_ARROW': 38,
		'RIGHT_ARROW': 39,
		'DOWN_ARROW': 40,
		'INSERT': 45,
		'DELETE': 46,
		'0': 48,
		'1': 49,
		'2': 50,
		'3': 51,
		'4': 52,
		'5': 53,
		'6': 54,
		'7': 55,
		'8': 56,
		'9': 57,
		'A': 65,
		'B': 66,
		'C': 67,
		'D': 68,
		'E': 69,
		'F': 70,
		'G': 71,
		'H': 72,
		'I': 73,
		'J': 74,
		'K': 75,
		'L': 76,
		'M': 77,
		'N': 78,
		'O': 79,
		'P': 80,
		'Q': 81,
		'R': 82,
		'S': 83,
		'T': 84,
		'U': 85,
		'V': 86,
		'W': 87,
		'X': 88,
		'Y': 89,
		'Z': 90,
		'NUMPAD_0': 96,
		'NUMPAD_1': 97,
		'NUMPAD_2': 98,
		'NUMPAD_3': 99,
		'NUMPAD_4': 100,
		'NUMPAD_5': 101,
		'NUMPAD_6': 102,
		'NUMPAD_7': 103,
		'NUMPAD_8': 104,
		'NUMPAD_9': 105,
		'MULTIPLY': 106,
		'ADD': 107,
		'SUBSTRACT': 109,
		'DECIMAL': 110,
		'DIVIDE': 111,
		'F1': 112,
		'F2': 113,
		'F3': 114,
		'F4': 115,
		'F5': 116,
		'F6': 117,
		'F7': 118,
		'F8': 119,
		'F9': 120,
		'F10': 121,
		'F11': 122,
		'F12': 123,
		'SHIFT': 16,
		'CTRL': 17,
		'ALT': 18,
		'PLUS': 187,
		'COMMA': 188,
		'MINUS': 189,
		'PERIOD': 190
	},

	/**@
	* #Crafty.mouseButtons
	* @category Input
	* Object of mouseButton names and the corresponding button ID.
	* In all mouseEvents we add the e.mouseButton property with a value normalized to match e.button of modern webkit
	* ~~~
	* LEFT: 0,
	* MIDDLE: 1,
	* RIGHT: 2
	* ~~~
	*/
	mouseButtons: {
		LEFT: 0,
		MIDDLE: 1,
		RIGHT: 2
	}
});



/**
* Entity fixes the lack of setter support
*/
Crafty.c("viewport", {
	init: function () {
		this.bind("EnterFrame", function () {
			if (Crafty.viewport._x !== Crafty.viewport.x) {
				Crafty.viewport.scroll('_x', Crafty.viewport.x);
			}

			if (Crafty.viewport._y !== Crafty.viewport.y) {
				Crafty.viewport.scroll('_y', Crafty.viewport.y);
			}
		});
	}
});
 /**@
* #Canvas
* @category Graphics
* Draws itself onto a canvas. Crafty.canvas.init() must be called before hand to initialize
* the canvas element.
* @trigger Draw - when the entity is ready to be drawn to the stage - {type: "canvas", pos, co, ctx}
* @trigger NoCanvas - if the browser does not support canvas
*/
Crafty.c("Canvas", {

	init: function () {
		if (!Crafty.canvas.context) {
			Crafty.canvas.init();
		}

		//increment the amount of canvas objs
		Crafty.DrawManager.total2D++;

		this.bind("Change", function (e) {
			//if within screen, add to list
			if (this._changed === false) {
				this._changed = Crafty.DrawManager.add(e || this, this);
			} else {
				if (e) this._changed = Crafty.DrawManager.add(e, this);
			}
		});

		this.bind("Remove", function () {
			Crafty.DrawManager.total2D--;
			Crafty.DrawManager.add(this, this);
		});
	},

	/**@
	* #.draw
	* @comp Canvas
	* @sign public this .draw([[Context ctx, ]Number x, Number y, Number w, Number h])
	* @param ctx - Canvas 2D context if drawing on another canvas is required
	* @param x - X offset for drawing a segment
	* @param y - Y offset for drawing a segment
	* @param w - Width of the segement to draw
	* @param h - Height of the segment to draw
	* Method to draw the entity on the canvas element. Can pass rect values for redrawing a segment of the entity.
	*/
	draw: function (ctx, x, y, w, h) {
		if (!this.ready) return;
		if (arguments.length === 4) {
			h = w;
			w = y;
			y = x;
			x = ctx;
			ctx = Crafty.canvas.context;
		}

		var pos = { //inlined pos() function, for speed
			_x: (this._x + (x || 0)),
			_y: (this._y + (y || 0)),
			_w: (w || this._w),
			_h: (h || this._h)
		},
			context = ctx || Crafty.canvas.context,
			coord = this.__coord || [0, 0, 0, 0],
			co = {
			x: coord[0] + (x || 0),
			y: coord[1] + (y || 0),
			w: w || coord[2],
			h: h || coord[3]
		};

		if (this._mbr) {
			context.save();

			context.translate(this._origin.x + this._x, this._origin.y + this._y);
			pos._x = -this._origin.x;
			pos._y = -this._origin.y;

			context.rotate((this._rotation % 360) * (Math.PI / 180));
		}

		//draw with alpha
		if (this._alpha < 1.0) {
			var globalpha = context.globalAlpha;
			context.globalAlpha = this._alpha;
		}

		this.trigger("Draw", { type: "canvas", pos: pos, co: co, ctx: context });

		if (this._mbr) {
			context.restore();
		}
		if (globalpha) {
			context.globalAlpha = globalpha;
		}
		return this;
	}
});

/**@
* #Crafty.canvas
* @category Graphics
* Collection of methods to draw on canvas.
*/
Crafty.extend({
	canvas: {
	/**@
		* #Crafty.canvas.context
		* @comp Crafty.canvas
		* This will return the 2D context of the main canvas element.
		* The value returned from `Crafty.canvas.elem.getContext('2d')`.
		*/
		context: null,
		/**@
		* #Crafty.canvas.elem
		* @comp Crafty.canvas
		* Main Canvas element
		*/
		elem: null,

		/**@
		* #Crafty.canvas.init
		* @comp Crafty.canvas
		* @sign public void Crafty.canvas.init(void)
		* Creates a `canvas` element inside the stage element. Must be called
		* before any entities with the Canvas component can be drawn.
		*
		* This method will automatically be called if no `Crafty.canvas.context` is
		* found.
		*/
		init: function () {
			//check if canvas is supported
			if (!Crafty.support.canvas) {
				Crafty.trigger("NoCanvas");
				Crafty.stop();
				return;
			}

			//create 3 empty canvas elements
			var c;
			c = document.createElement("canvas");
			c.width = Crafty.viewport.width;
			c.height = Crafty.viewport.height;
			c.style.position = 'absolute';
			c.style.left = "0px";
			c.style.top = "0px";

			Crafty.stage.elem.appendChild(c);
			Crafty.canvas.context = c.getContext('2d');
			Crafty.canvas._canvas = c;
		}
	}
}); Crafty.extend({
	over: null, //object mouseover, waiting for out
	mouseObjs: 0,
	mousePos: {},
	lastEvent: null,
	keydown: {},

	mouseDispatch: function (e) {
		if (!Crafty.mouseObjs) return;
		Crafty.lastEvent = e;

		var maxz = -1,
			closest,
			q,
			i = 0, l,
			pos = Crafty.DOM.translate(e.clientX, e.clientY),
			x, y,
			dupes = {},
			tar = e.target ? e.target : e.srcElement,
			type = e.type;

		if (type === "touchstart") type = "mousedown";
		else if (type === "touchmove") type = "mousemove";
		else if (type === "touchend") type = "mouseup";

		//Normalize button according to http://unixpapa.com/js/mouse.html
		if (e.which == null) {
			e.mouseButton = (e.button < 2) ? Crafty.mouseButtons.LEFT : ((e.button == 4) ? Crafty.mouseButtons.MIDDLE : Crafty.mouseButtons.RIGHT);
		} else {
			e.mouseButton = (e.which < 2) ? Crafty.mouseButtons.LEFT : ((e.which == 2) ? Crafty.mouseButtons.MIDDLE : Crafty.mouseButtons.RIGHT);
		}

		e.realX = x = Crafty.mousePos.x = pos.x;
		e.realY = y = Crafty.mousePos.y = pos.y;

		//if it's a DOM element with Mouse component we are done
		if (tar.nodeName != "CANVAS") {
			while (typeof (tar.id) != 'string' && tar.id.indexOf('ent') == -1) {
				tar = tar.parentNode;
			}
			ent = Crafty(parseInt(tar.id.replace('ent', '')))
			if (ent.has('Mouse') && ent.isAt(x, y))
				closest = ent;
		}
		//else we search for an entity with Mouse component
		if (!closest) {
			q = Crafty.map.search({ _x: x, _y: y, _w: 1, _h: 1 }, false);

			for (l = q.length; i < l; ++i) {
				if (!q[i].__c.Mouse || !q[i]._visible) continue;

				var current = q[i],
					flag = false;

				//weed out duplicates
				if (dupes[current[0]]) continue;
				else dupes[current[0]] = true;

				if (current.map) {
					if (current.map.containsPoint(x, y)) {
						flag = true;
					}
				} else if (current.isAt(x, y)) flag = true;

				if (flag && (current._z >= maxz || maxz === -1)) {
					//if the Z is the same, select the closest GUID
					if (current._z === maxz && current[0] < closest[0]) {
						continue;
					}
					maxz = current._z;
					closest = current;
				}
			}
		}

		//found closest object to mouse
		if (closest) {
			//click must mousedown and out on tile
			if (type === "mousedown") {
				closest.trigger("MouseDown", e);
			} else if (type === "mouseup") {
				closest.trigger("MouseUp", e);
			} else if (type == "dblclick") {
				closest.trigger("DoubleClick", e);
			} else if (type == "click") {
				closest.trigger("Click", e);
			}else if (type === "mousemove") {
				closest.trigger("MouseMove", e);
				if (this.over !== closest) { //if new mousemove, it is over
					if (this.over) {
						this.over.trigger("MouseOut", e); //if over wasn't null, send mouseout
						this.over = null;
					}
					this.over = closest;
					closest.trigger("MouseOver", e);
				}
			} else closest.trigger(type, e); //trigger whatever it is
		} else {
			if (type === "mousemove" && this.over) {
				this.over.trigger("MouseOut", e);
				this.over = null;
			}
			if (type === "mousedown") {
				Crafty.viewport.mouselook('start', e);
			}
			else if (type === "mousemove") {
				Crafty.viewport.mouselook('drag', e);
			}
			else if (type == "mouseup") {
				Crafty.viewport.mouselook('stop');
			}
		}

		if (type === "mousemove") {
			this.lastEvent = e;
		}

	},

	keyboardDispatch: function (e) {
		e.key = e.keyCode || e.which;
		if (e.type === "keydown") {
			if (Crafty.keydown[e.key] !== true) {
				Crafty.keydown[e.key] = true;
				Crafty.trigger("KeyDown", e);
			}
		} else if (e.type === "keyup") {
			delete Crafty.keydown[e.key];
			Crafty.trigger("KeyUp", e);
		}

		//prevent searchable keys
		/*
		if((e.metaKey || e.altKey || e.ctrlKey) && !(e.key == 8 || e.key >= 112 && e.key <= 135)) {
			console.log(e);
			if(e.preventDefault) e.preventDefault();
			else e.returnValue = false;
			return false;
		}*/
	}
});

//initialize the input events onload
Crafty.bind("Load", function () {
	Crafty.addEvent(this, "keydown", Crafty.keyboardDispatch);
	Crafty.addEvent(this, "keyup", Crafty.keyboardDispatch);

	Crafty.addEvent(this, Crafty.stage.elem, "mousedown", Crafty.mouseDispatch);
	Crafty.addEvent(this, Crafty.stage.elem, "mouseup", Crafty.mouseDispatch);
	Crafty.addEvent(this, Crafty.stage.elem, "mousemove", Crafty.mouseDispatch);
	Crafty.addEvent(this, Crafty.stage.elem, "click", Crafty.mouseDispatch);
	Crafty.addEvent(this, Crafty.stage.elem, "dblclick", Crafty.mouseDispatch);

	Crafty.addEvent(this, Crafty.stage.elem, "touchstart", Crafty.mouseDispatch);
	Crafty.addEvent(this, Crafty.stage.elem, "touchmove", Crafty.mouseDispatch);
	Crafty.addEvent(this, Crafty.stage.elem, "touchend", Crafty.mouseDispatch);
});

/**@
* #Mouse
* @category Input
* Provides the entity with mouse related events
* @trigger MouseOver - when the mouse enters the entity - MouseEvent
* @trigger MouseOut - when the mouse leaves the entity - MouseEvent
* @trigger MouseDown - when the mouse button is pressed on the entity - MouseEvent
* @trigger MouseUp - when the mouse button is released on the entity - MouseEvent
* @trigger Click - when the user clicks the entity. [See documentation](http://www.quirksmode.org/dom/events/click.html) - MouseEvent
* @trigger DoubleClick - when the user double clicks the entity - MouseEvent
* @trigger MouseMove - when the mouse is over the entity and moves - MouseEvent
* Crafty adds the mouseButton property to MouseEvents that match one of
*
* - Crafty.mouseButtons.LEFT
* - Crafty.mouseButtons.RIGHT
* - Crafty.mouseButtons.MIDDLE
* @example
* ~~~
* myEntity.bind('Click', function() {
*      console.log("Clicked!!");
* })
*
* myEntity.bind('Click', function(e) {
*    if( e.mouseButton == Crafty.mouseButtons.RIGHT )
*        console.log("Clicked right button");
* })
* ~~~
*/
Crafty.c("Mouse", {
	init: function () {
		Crafty.mouseObjs++;
		this.bind("Remove", function () {
			Crafty.mouseObjs--;
		});
	},

	/**@
	* #.areaMap
	* @comp Mouse
	* @sign public this .areaMap(Crafty.Polygon polygon)
	* @param polygon - Instance of Crafty.Polygon used to check if the mouse coordinates are inside this region
	* @sign public this .areaMap(Array point1, .., Array pointN)
	* @param point# - Array with an `x` and `y` position to generate a polygon
	* Assign a polygon to the entity so that mouse events will only be triggered if
	* the coordinates are inside the given polygon.
	* ~~~
	* Crafty.e("2D, DOM, Color, Mouse")
	*     .color("red")
	*     .attr({ w: 100, h: 100 })
	*     .bind('MouseOver', function() {console.log("over")})
	*     .areaMap([0,0], [50,0], [50,50], [0,50])
	* ~~~
	* @see Crafty.Polygon
	*/
	areaMap: function (poly) {
		//create polygon
		if (arguments.length > 1) {
			//convert args to array to create polygon
			var args = Array.prototype.slice.call(arguments, 0);
			poly = new Crafty.polygon(args);
		}

		poly.shift(this._x, this._y);
		this.map = poly;

		this.attach(this.map);
		return this;
	}
});

/**@
* #Draggable
* @category Input
* Enable drag and drop of the entity.
* @trigger Dragging - is triggered each frame the entity is being dragged - MouseEvent
* @trigger StartDrag - is triggered when dragging begins - MouseEvent
* @trigger StopDrag - is triggered when dragging ends - MouseEvent
*/
Crafty.c("Draggable", {
	_startX: 0,
	_startY: 0,
	_dragging: false,

	_ondrag: null,
	_ondown: null,
	_onup: null,

	init: function () {
		this.requires("Mouse");
		this._ondrag = function (e) {
			var pos = Crafty.DOM.translate(e.clientX, e.clientY);
			this.x = pos.x - this._startX;
			this.y = pos.y - this._startY;

			this.trigger("Dragging", e);
		};

		this._ondown = function (e) {
			if (e.mouseButton !== Crafty.mouseButtons.LEFT) return;

			//start drag
			this._startX = e.realX - this._x;
			this._startY = e.realY - this._y;
			this._dragging = true;

			Crafty.addEvent(this, Crafty.stage.elem, "mousemove", this._ondrag);
			Crafty.addEvent(this, Crafty.stage.elem, "mouseup", this._onup);
			this.trigger("StartDrag", e);
		};

		this._onup = function upper(e) {
			Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", this._ondrag);
			Crafty.removeEvent(this, Crafty.stage.elem, "mouseup", this._onup);
			this._dragging = false;
			this.trigger("StopDrag", e);
		};

		this.enableDrag();
	},

	/**@
	* #.stopDrag
	* @comp Draggable
	* @sign public this .stopDrag(void)
	* Stop the entity from dragging. Essentially reproducing the drop.
	* @trigger StopDrag - Called right after the mouse listeners are removed
	* @see .startDrag
	*/
	stopDrag: function () {
		Crafty.removeEvent(this, Crafty.stage.elem, "mousemove", this._ondrag);
		Crafty.removeEvent(this, Crafty.stage.elem, "mouseup", this._onup);

		this._dragging = false;
		this.trigger("StopDrag");
		return this;
	},

	/**@
	* #.startDrag
	* @comp Draggable
	* @sign public this .startDrag(void)
	* Make the entity follow the mouse positions.
	* @see .stopDrag
	*/
	startDrag: function () {
		if (!this._dragging) {
			this._dragging = true;
			Crafty.addEvent(this, Crafty.stage.elem, "mousemove", this._ondrag);
		}
		return this;
	},

	/**@
	* #.enableDrag
	* @comp Draggable
	* @sign public this .enableDrag(void)
	* Rebind the mouse events. Use if `.disableDrag` has been called.
	* @see .disableDrag
	*/
	enableDrag: function () {
		this.bind("MouseDown", this._ondown);

		Crafty.addEvent(this, Crafty.stage.elem, "mouseup", this._onup);
		return this;
	},

	/**@
	* #.disableDrag
	* @comp Draggable
	* @sign public this .disableDrag(void)
	* Stops entity from being draggable. Reenable with `.enableDrag()`.
	* @see .enableDrag
	*/
	disableDrag: function () {
		this.unbind("MouseDown", this._ondown);
		this.stopDrag();
		return this;
	}
});

/**@
* #Keyboard
* @category Input
* Give entities keyboard events (`keydown` and `keyup`).
*/
Crafty.c("Keyboard", {
/**@
	* #.isDown
	* @comp Keyboard
	* @sign public Boolean isDown(String keyName)
	* @param keyName - Name of the key to check. See `Crafty.keys`.
	* @sign public Boolean isDown(Number keyCode)
	* @param keyCode - Key code in `Crafty.keys`.
	* Determine if a certain key is currently down.
	*/
	isDown: function (key) {
		if (typeof key === "string") {
			key = Crafty.keys[key];
		}
		return !!Crafty.keydown[key];
	}
});

/**@
* #Multiway
* @category Input
* Used to bind keys to directions and have the entity move acordingly
* @trigger NewDirection - triggered when direction changes - { x:Number, y:Number } - New direction
* @trigger Moved - triggered on movement on either x or y axis. If the entity has moved on both axes for diagonal movement the event is triggered twice - { x:Number, y:Number } - Old position
*/
Crafty.c("Multiway", {
	_speed: 3,

	init: function () {
		this._keyDirection = {};
		this._keys = {};
		this._movement = { x: 0, y: 0 };
		this._speed = { x: 3, y: 3 };
	},

	/**@
	* #.multiway
	* @comp Multiway
	* @sign public this .multiway([Number speed,] Object keyBindings )
	* @param speed - Amount of pixels to move the entity whilst a key is down
	* @param keyBindings - What keys should make the entity go in which direction. Direction is specified in degrees
	* Constructor to initialize the speed and keyBindings. Component will listen for key events and move the entity appropriately.
	*
	* When direction changes a NewDirection event is triggered with an object detailing the new direction: {x: x_movement, y: y_movement}
	* When entity has moved on either x- or y-axis a Moved event is triggered with an object specifying the old position {x: old_x, y: old_y}
	* @example
	* ~~~
	* this.multiway(3, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180});
	* this.multiway({x:3,y:1.5}, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180});
	* this.multiway({W: -90, S: 90, D: 0, A: 180});
	* ~~~
	*/
	multiway: function (speed, keys) {
		if (keys) {
			if (speed.x && speed.y) {
				this._speed.x = speed.x;
				this._speed.y = speed.y;
			} else {
				this._speed.x = speed;
				this._speed.y = speed;
			}
		} else {
			keys = speed;
		}

		this._keyDirection = keys;
		this.speed(this._speed);

		this.bind("KeyDown", function (e) {
			if (this._keys[e.key]) {
				this._movement.x = Math.round((this._movement.x + this._keys[e.key].x) * 1000) / 1000;
				this._movement.y = Math.round((this._movement.y + this._keys[e.key].y) * 1000) / 1000;
				this.trigger('NewDirection', this._movement);
			}
		})
		.bind("KeyUp", function (e) {
			if (this._keys[e.key]) {
				this._movement.x = Math.round((this._movement.x - this._keys[e.key].x) * 1000) / 1000;
				this._movement.y = Math.round((this._movement.y - this._keys[e.key].y) * 1000) / 1000;
				this.trigger('NewDirection', this._movement);
			}
		})
		.bind("EnterFrame", function () {
			if (this.disableControls) return;

			if (this._movement.x !== 0) {
				this.x += this._movement.x;
				this.trigger('Moved', { x: this.x - this._movement.x, y: this.y });
			}
			if (this._movement.y !== 0) {
				this.y += this._movement.y;
				this.trigger('Moved', { x: this.x, y: this.y - this._movement.y });
			}
		});

		//Apply movement if key is down when created
		for (var k in keys) {
			if (Crafty.keydown[Crafty.keys[k]]) {
				this.trigger("KeyDown", { key: Crafty.keys[k] });
			}
		}

		return this;
	},

	speed: function (speed) {
		for (var k in this._keyDirection) {
			var keyCode = Crafty.keys[k] || k;
			this._keys[keyCode] = {
				x: Math.round(Math.cos(this._keyDirection[k] * (Math.PI / 180)) * 1000 * speed.x) / 1000,
				y: Math.round(Math.sin(this._keyDirection[k] * (Math.PI / 180)) * 1000 * speed.y) / 1000
			};
		}
		return this;
	}
});

/**@
* #Fourway
* @category Input
* Move an entity in four directions by using the
* arrow keys or `W`, `A`, `S`, `D`.
*/
Crafty.c("Fourway", {

	init: function () {
		this.requires("Multiway");
	},

	/**@
	* #.fourway
	* @comp Fourway
	* @sign public this .fourway(Number speed)
	* @param speed - Amount of pixels to move the entity whilst a key is down
	* Constructor to initialize the speed. Component will listen for key events and move the entity appropriately.
	* This includes `Up Arrow`, `Right Arrow`, `Down Arrow`, `Left Arrow` as well as `W`, `A`, `S`, `D`.
	*
	* When direction changes a NewDirection event is triggered with an object detailing the new direction: {x: x_movement, y: y_movement}
	* When entity has moved on either x- or y-axis a Moved event is triggered with an object specifying the old position {x: old_x, y: old_y}
	*
	* The key presses will move the entity in that direction by the speed passed in the argument.
	* @see Multiway
	*/
	fourway: function (speed) {
		this.multiway(speed, {
			UP_ARROW: -90,
			DOWN_ARROW: 90,
			RIGHT_ARROW: 0,
			LEFT_ARROW: 180,
			W: -90,
			S: 90,
			D: 0,
			A: 180
		});

		return this;
	}
});

/**@
* #Twoway
* @category Input
* Move an entity left or right using the arrow keys or `D` and `A` and jump using up arrow or `W`.
*
* When direction changes a NewDirection event is triggered with an object detailing the new direction: {x: x_movement, y: y_movement}. This is consistent with Fourway and Multiway components.
* When entity has moved on x-axis a Moved event is triggered with an object specifying the old position {x: old_x, y: old_y}
*
*/
Crafty.c("Twoway", {
	_speed: 3,
	_up: false,

	init: function () {
		this.requires("Fourway, Keyboard");
	},

	/**@
	* #.twoway
	* @comp Twoway
	* @sign public this .twoway(Number speed[, Number jumpSpeed])
	* @param speed - Amount of pixels to move left or right
	* @param jumpSpeed - How high the entity should jump
	* Constructor to initialize the speed and power of jump. Component will
	* listen for key events and move the entity appropriately. This includes
	* `Up Arrow`, `Right Arrow`, `Left Arrow` as well as W, A, D. Used with the
	* `gravity` component to simulate jumping.
	*
	* The key presses will move the entity in that direction by the speed passed in
	* the argument. Pressing the `Up Arrow` or `W` will cause the entiy to jump.
	* @see Gravity, Fourway
	*/
	twoway: function (speed, jump) {

		this.multiway(speed, {
			RIGHT_ARROW: 0,
			LEFT_ARROW: 180,
			D: 0,
			A: 180
		});

		if (speed) this._speed = speed;
		jump = jump || this._speed * 2;

		this.bind("EnterFrame", function () {
			if (this.disableControls) return;
			if (this._up) {
				this.y -= jump;
				this._falling = true;
			}
		}).bind("KeyDown", function () {
			if (this.isDown("UP_ARROW") || this.isDown("W")) this._up = true;
		});

		return this;
	}
});
 /**@
* #SpriteAnimation
* @category Animation
* Used to animate sprites by changing the sprites in the sprite map.
* @trigger AnimationEnd - When the animation finishes - { reel }
* @trigger Change - On each frame
*/
Crafty.c("SpriteAnimation", {
	_reels: null,
	_frame: null,
	_current: null,

	init: function () {
		this._reels = {};
	},

	/**@
	* #.animate
	* @comp SpriteAnimation
	* @sign public this .animate(String id, Number fromX, Number y, Number toX)
	* @param id - ID of the animation reel being created
	* @param fromX - Starting `x` position on the sprite map
	* @param y - `y` position on the sprite map. Will remain constant through the animation.
	* @param toX - End `x` position on the sprite map
	* @sign public this .animate(String id, Array frames)
	* @param id - ID of the animation reel being created
	* @param frames - Array of arrays containing the `x` and `y` values: [[x1,y1],[x2,y2],...]
	* @sign public this .animate(String id, Number duration[, Number repeatCount])
	* @param id - ID of the animation reel to play
	* @param duration - Play the animation with a duration (in frames)
	* @param repeatCount - number of times to repeat the animation. Use -1 for infinitely
	*
	* Method to setup animation reels or play pre-made reels. Animation works by changing the sprites over
	* a duration. Only works for sprites built with the Crafty.sprite methods. See the Tween component for animation of 2D properties.
	*
	* To setup an animation reel, pass the name of the reel (used to identify the reel and play it later), and either an
	* array of absolute sprite positions or the start x on the sprite map, the y on the sprite map and then the end x on the sprite map.
	*
	* To play a reel, pass the name of the reel and the duration it should play for (in frames). If you need
	* to repeat the animation, simply pass in the amount of times the animation should repeat. To repeat
	* forever, pass in `-1`.
	*
	* @example
	* ~~~
	* Crafty.sprite(16, "images/sprite.png", {
	*     PlayerSprite: [0,0]
	* });
	*
	* Crafty.e("2D, DOM, SpriteAnimation, PlayerSprite")
	*     .animate('PlayerRunning', 0, 0, 3) //setup animation
	*     .animate('PlayerRunning', 15, -1) // start animation
	*
	* ~~~
	*
	* @see crafty.sprite
	*/
	animate: function (id, fromx, y, tox) {
		var reel, i, tile, tileh, duration, pos;

		//play a reel
		if (arguments.length < 4 && typeof fromx === "number") {
			//make sure not currently animating
			this._current = id;

			reel = this._reels[id];
			duration = fromx;

			this._frame = {
				reel: reel, //reel to play
				frameTime: Math.ceil(duration / reel.length), //number of frames inbetween slides
				frame: 0, //current slide/frame
				current: 0,
				repeat: 0
			};
			if (arguments.length === 3 && typeof y === "number") {
				//User provided repetition count
				if (y === -1) this._frame.repeatInfinitly = true;
				else this._frame.repeat = y;
			}

			pos = this._frame.reel[0];
			this.__coord[0] = pos[0];
			this.__coord[1] = pos[1];

			this.bind("EnterFrame", this.drawFrame);
			return this;
		}
		if (typeof fromx === "number") {
			i = fromx;
			reel = [];
			tile = this.__tile;
			tileh = this.__tileh;

			if (tox > fromx) {
				for (; i <= tox; i++) {
					reel.push([i * tile, y * tileh]);
				}
			} else {
				for (; i >= tox; i--) {
					reel.push([i * tile, y * tileh]);
				}
			}

			this._reels[id] = reel;
		} else if (typeof fromx === "object") {
			i = 0;
			reel = [];
			tox = fromx.length - 1;
			tile = this.__tile;
			tileh = this.__tileh;

			for (; i <= tox; i++) {
				pos = fromx[i];
				reel.push([pos[0] * tile, pos[1] * tileh]);
			}

			this._reels[id] = reel;
		}

		return this;
	},

	drawFrame: function (e) {
		var data = this._frame;

		if (this._frame.current++ === data.frameTime) {
			var pos = data.reel[data.frame++];

			this.__coord[0] = pos[0];
			this.__coord[1] = pos[1];
			this._frame.current = 0;
		}


		if (data.frame === data.reel.length && this._frame.current === data.frameTime) {
			data.frame = 0;
			if (this._frame.repeatInfinitly === true || this._frame.repeat > 0) {
				if (this._frame.repeat) this._frame.repeat--;
				this._frame.current = 0;
				this._frame.frame = 0;
			} else {
				this.trigger("AnimationEnd", { reel: data.reel });
				this.stop();
				return;
			}
		}

		this.trigger("Change");
	},

	/**@
	* #.stop
	* @comp SpriteAnimation
	* @sign public this .stop(void)
	* Stop any animation currently playing.
	*/
	stop: function () {
		this.unbind("EnterFrame", this.drawFrame);
		this.unbind("AnimationEnd");
		this._current = null;
		this._frame = null;

		return this;
	},

	/**@
	* #.reset
	* @comp SpriteAnimation
	* @sign public this .reset(void)
	* Method will reset the entities sprite to its original.
	*/
	reset: function () {
		if (!this._frame) return this;

		var co = this._frame.reel[0];
		this.__coord[0] = co[0];
		this.__coord[1] = co[1];
		this.stop();

		return this;
	},

	/**@
	* #.isPlaying
	* @comp SpriteAnimation
	* @sign public Boolean .isPlaying([String id])
	* @param id - Determine if the animation reel with this ID is playing
	* Determines if an animation is currently playing. If a reel is passed, it will determine
	* if the passed reel is playing.
	* ~~~
	* myEntity.isPlaying() //is any animation playing
	* myEntity.isPlaying('PlayerRunning') //is the PlayerRunning animation playing
	* ~~~
	*/
	isPlaying: function (id) {
		if (!id) return !!this._interval;
		return this._current === id;
	}
});

/**@
* #Tween
* @category Animation
* Component to animate the change in 2D properties over time.
* @trigger TweenEnd - when a tween finishes - String - property
*/
Crafty.c("Tween", {
	_step: null,
	_numProps: 0,

	/**@
	* #.tween
	* @comp Tween
	* @sign public this .tween(Object properties, Number duration)
	* @param properties - Object of 2D properties and what they should animate to
	* @param duration - Duration to animate the properties over (in frames)
	* This method will animate a 2D entities properties over the specified duration.
	* These include `x`, `y`, `w`, `h`, `alpha` and `rotation`.
	*
	* The object passed should have the properties as keys and the value should be the resulting
	* values of the properties.
	* @example
	* Move an object to 100,100 and fade out in 200 frames.
	* ~~~
	* Crafty.e("2D, Tween")
	*    .attr({alpha: 1.0, x: 0, y: 0})
	*    .tween({alpha: 0.0, x: 100, y: 100}, 200)
	* ~~~
	*/
	tween: function (props, duration) {
		this.each(function () {
			if (this._step == null) {
				this._step = {};
				this.bind('EnterFrame', tweenEnterFrame);
				this.bind('RemoveComponent', function (c) {
					if (c == 'Tween') {
						this.unbind('EnterFrame', tweenEnterFrame);
					}
				});
			}

			for (var prop in props) {
				this._step[prop] = { prop: props[prop], val: (props[prop] - this[prop]) / duration, rem: duration };
				this._numProps++;
			}
		});
		return this;
	}
});

function tweenEnterFrame(e) {
	if (this._numProps <= 0) return;

	var prop, k;
	for (k in this._step) {
		prop = this._step[k];
		this[k] += prop.val;
		if (prop.rem-- == 0) {
			// decimal numbers rounding fix
			this[k] = prop.prop;
			this.trigger("TweenEnd", k);
			delete this._step[k];
			this._numProps--;
		}
	}

	if (this.has('Mouse')) {
		var over = Crafty.over,
			mouse = Crafty.mousePos;
		if (over && over[0] == this[0] && !this.isAt(mouse.x, mouse.y)) {
			this.trigger('MouseOut', Crafty.lastEvent);
			Crafty.over = null;
		}
		else if ((!over || over[0] != this[0]) && this.isAt(mouse.x, mouse.y)) {
			Crafty.over = this;
			this.trigger('MouseOver', Crafty.lastEvent);
		}
	}
}

 /**@
* #Sprite
* @category Graphics
* @trigger Change - when the sprites change
* Component for using tiles in a sprite map.
*/
Crafty.c("Sprite", {
	__image: '',
	__tile: 0,
	__tileh: 0,
	__padding: null,
	__trim: null,
	img: null,
	ready: false,

	init: function () {
		this.__trim = [0, 0, 0, 0];

		var draw = function (e) {
			var co = e.co,
				pos = e.pos,
				context = e.ctx;

			if (e.type === "canvas") {
				//draw the image on the canvas element
				context.drawImage(this.img, //image element
								 co.x, //x position on sprite
								 co.y, //y position on sprite
								 co.w, //width on sprite
								 co.h, //height on sprite
								 pos._x, //x position on canvas
								 pos._y, //y position on canvas
								 pos._w, //width on canvas
								 pos._h //height on canvas
				);
			} else if (e.type === "DOM") {
				this._element.style.background = "url('" + this.__image + "') no-repeat -" + co.x + "px -" + co.y + "px";
			}
		};

		this.bind("Draw", draw).bind("RemoveComponent", function (id) {
			if (id === "Sprite") this.unbind("Draw", draw);
		});
	},

	/**@
	* #.sprite
	* @comp Sprite
	* @sign public this .sprite(Number x, Number y, Number w, Number h)
	* @param x - X cell position
	* @param y - Y cell position
	* @param w - Width in cells
	* @param h - Height in cells
	* Uses a new location on the sprite map as its sprite.
	*
	* Values should be in tiles or cells (not pixels).
	*
	* @example
	* ~~~
	* Crafty.e("2D, DOM, Sprite")
	* 	.sprite(0, 0, 2, 2);
	* ~~~
	*/
	sprite: function (x, y, w, h) {
		this.__coord = [x * this.__tile + this.__padding[0] + this.__trim[0],
						y * this.__tileh + this.__padding[1] + this.__trim[1],
						this.__trim[2] || w * this.__tile || this.__tile,
						this.__trim[3] || h * this.__tileh || this.__tileh];

		this.trigger("Change");
		return this;
	},

	/**@
	* #.crop
	* @comp Sprite
	* @sign public this .crop(Number x, Number y, Number w, Number h)
	* @param x - Offset x position
	* @param y - Offset y position
	* @param w - New width
	* @param h - New height
	* If the entity needs to be smaller than the tile size, use this method to crop it.
	*
	* The values should be in pixels rather than tiles.
	*
	* @example
	* ~~~
	* Crafty.e("2D, DOM, Sprite")
	* 	.crop(40, 40, 22, 23);
	* ~~~
	*/
	crop: function (x, y, w, h) {
		var old = this._mbr || this.pos();
		this.__trim = [];
		this.__trim[0] = x;
		this.__trim[1] = y;
		this.__trim[2] = w;
		this.__trim[3] = h;

		this.__coord[0] += x;
		this.__coord[1] += y;
		this.__coord[2] = w;
		this.__coord[3] = h;
		this._w = w;
		this._h = h;

		this.trigger("Change", old);
		return this;
	}
}); /**@
* #Color
* @category Graphics
* @trigger Change - when the color changes
* Draw a solid color for the entity
*/
Crafty.c("Color", {
	_color: "",
	ready: true,

	init: function () {
		this.bind("Draw", function (e) {
			if (e.type === "DOM") {
				e.style.background = this._color;
				e.style.lineHeight = 0;
			} else if (e.type === "canvas") {
				if (this._color) e.ctx.fillStyle = this._color;
				e.ctx.fillRect(e.pos._x, e.pos._y, e.pos._w, e.pos._h);
			}
		});
	},

	/**@
	* #.color
	* @comp Color
	* @sign public this .color(String color)
	* @param color - Color of the rectangle
	* Will create a rectangle of solid color for the entity.
	*
	* The argument must be a color readable depending on which browser you
	* choose to support. IE 8 and below doesn't support the rgb() syntax.
	* @example
	* ~~~
	* Crafty.e("2D, DOM, Color")
	*    .color("#969696");
	* ~~~
	*/
	color: function (color) {
		this._color = color;
		this.trigger("Change");
		return this;
	}
});

/**@
* #Tint
* @category Graphics
* @trigger Change - when the tint is applied
* Similar to Color by adding an overlay of semi-transparent color.
*
* *Note: Currently only works for Canvas*
*/
Crafty.c("Tint", {
	_color: null,
	_strength: 1.0,

	init: function () {
		var draw = function d(e) {
			var context = e.ctx || Crafty.canvas.context;

			context.fillStyle = this._color || "rgb(0,0,0)";
			context.fillRect(e.pos._x, e.pos._y, e.pos._w, e.pos._h);
		};

		this.bind("Draw", draw).bind("RemoveComponent", function (id) {
			if (id === "Tint") this.unbind("Draw", draw);
		});
	},

	/**@
	* #.tint
	* @comp Tint
	* @sign public this .tint(String color, Number strength)
	* @param color - The color in hexidecimal
	* @param strength - Level of opacity
	* Modify the color and level opacity to give a tint on the entity.
	* @example
	* ~~~
	* Crafty.e("2D, Canvas, Tint")
	*    .tint("#969696", 0.3);
	* ~~~
	*/
	tint: function (color, strength) {
		this._strength = strength;
		this._color = Crafty.toRGB(color, this._strength);

		this.trigger("Change");
		return this;
	}
});

/**@
* #Image
* @category Graphics
* Draw an image with or without repeating (tiling).
*/
Crafty.c("Image", {
	_repeat: "repeat",
	ready: false,

	init: function () {
		var draw = function (e) {
			if (e.type === "canvas") {
				//skip if no image
				if (!this.ready || !this._pattern) return;

				var context = e.ctx;

				context.fillStyle = this._pattern;

				//context.save();
				//context.translate(e.pos._x, e.pos._y);
				context.fillRect(this._x, this._y, this._w, this._h);
				//context.restore();
			} else if (e.type === "DOM") {
				if (this.__image)
					e.style.background = "url(" + this.__image + ") " + this._repeat;
			}
		};

		this.bind("Draw", draw).bind("RemoveComponent", function (id) {
			if (id === "Image") this.unbind("Draw", draw);
		});
	},

	/**@
	* #.image
	* @comp Image
	* @trigger Change - when the image is loaded
	* @sign public this .image(String url[, String repeat])
	* @param url - URL of the image
	* @param repeat - If the image should be repeated to fill the entity.
	* Draw specified image. Repeat follows CSS syntax (`"no-repeat", "repeat", "repeat-x", "repeat-y"`);
	*
	* *Note: Default repeat is `no-repeat` which is different to standard DOM (which is `repeat`)*
	*
	* If the width and height are `0` and repeat is set to `no-repeat` the width and
	* height will automatically assume that of the image. This is an
	* easy way to create an image without needing sprites.
	* @example
	* Will default to no-repeat. Entity width and height will be set to the images width and height
	* ~~~
	* var ent = Crafty.e("2D, DOM, Image").image("myimage.png");
	* ~~~
	* Create a repeating background.
	* ~~~
    * var bg = Crafty.e("2D, DOM, Image")
	*              .attr({w: Crafty.viewport.width, h: Crafty.viewport.height})
	*              .image("bg.png", "repeat");
	* ~~~
	* @see Crafty.sprite
	*/
	image: function (url, repeat) {
		this.__image = url;
		this._repeat = repeat || "no-repeat";


		this.img = Crafty.assets[url];
		if (!this.img) {
			this.img = new Image();
			Crafty.assets[url] = this.img;
			this.img.src = url;
			var self = this;

			this.img.onload = function () {
				if (self.has("Canvas")) self._pattern = Crafty.canvas.context.createPattern(self.img, self._repeat);
				self.ready = true;

				if (self._repeat === "no-repeat") {
					self.w = self.img.width;
					self.h = self.img.height;
				}

				self.trigger("Change");
			};

			return this;
		} else {
			this.ready = true;
			if (this.has("Canvas")) this._pattern = Crafty.canvas.context.createPattern(this.img, this._repeat);
			if (this._repeat === "no-repeat") {
				this.w = this.img.width;
				this.h = this.img.height;
			}
		}


		this.trigger("Change");

		return this;
	}
});

Crafty.extend({
	_scenes: [],
	_current: null,

	/**@
	* #Crafty.scene
	* @category Scenes, Stage
	* @trigger SceneChange - when a scene is played - { oldScene:String, newScene:String }
	* @sign public void Crafty.scene(String sceneName, Function init)
	* @param sceneName - Name of the scene to add
	* @param init - Function execute when scene is played
	* @sign public void Crafty.scene(String sceneName)
	* @param sceneName - Name of scene to play
	* Method to create scenes on the stage. Pass an ID and function to register a scene.
	*
	* To play a scene, just pass the ID. When a scene is played, all
	* entities with the `2D` component on the stage are destroyed.
	*
	* If you want some entities to persist over scenes (as in not be destroyed)
	* simply add the component `Persist`.
	*
	* @example
	* ~~~
	* Crafty.scene("loading", function() {});
	*
	* Crafty.scene("loading");
	* ~~~
	*/
	scene: function (name, fn) {
		//play scene
		if (arguments.length === 1) {
			Crafty("2D").each(function () {
				if (!this.has("Persist")) this.destroy();
			});
			this._scenes[name].call(this);
			var oldScene = this._current;
			this._current = name;
			Crafty.trigger("SceneChange", { oldScene: oldScene, newScene: name });
			return;
		}
		//add scene
		this._scenes[name] = fn;
		return;
	},

	rgbLookup: {},

	toRGB: function (hex, alpha) {
		var lookup = this.rgbLookup[hex];
		if (lookup) return lookup;

		var hex = (hex.charAt(0) === '#') ? hex.substr(1) : hex,
			c = [], result;

		c[0] = parseInt(hex.substr(0, 2), 16);
		c[1] = parseInt(hex.substr(2, 2), 16);
		c[2] = parseInt(hex.substr(4, 2), 16);

		result = alpha === undefined ? 'rgb(' + c.join(',') + ')' : 'rgba(' + c.join(',') + ',' + alpha + ')';
		lookup = result;

		return result;
	}
});

/**
* Draw Manager will manage objects to be drawn and implement
* the best method of drawing in both DOM and canvas
*/
Crafty.DrawManager = (function () {
	/** array of dirty rects on screen */
	var register = [],
	/** array of DOMs needed updating */
		dom = [];

	return {
	/** Quick count of 2D objects */
		total2D: Crafty("2D").length,

		onScreen: function (rect) {
			return Crafty.viewport._x + rect._x + rect._w > 0 && Crafty.viewport._y + rect._y + rect._h > 0 &&
				   Crafty.viewport._x + rect._x < Crafty.viewport.width && Crafty.viewport._y + rect._y < Crafty.viewport.height;
		},

		merge: function (set) {
			do {
				var newset = [], didMerge = false, i = 0,
					l = set.length, current, next, merger;

				while (i < l) {
					current = set[i];
					next = set[i + 1];

					if (i < l - 1 && current._x < next._x + next._w && current._x + current._w > next._x &&
									current._y < next._y + next._h && current._h + current._y > next._y) {

						merger = {
							_x: ~~Math.min(current._x, next._x),
							_y: ~~Math.min(current._y, next._y),
							_w: Math.max(current._x, next._x) + Math.max(current._w, next._w),
							_h: Math.max(current._y, next._y) + Math.max(current._h, next._h)
						};
						merger._w = merger._w - merger._x;
						merger._h = merger._h - merger._y;
						merger._w = (merger._w == ~~merger._w) ? merger._w : merger._w + 1 | 0;
						merger._h = (merger._h == ~~merger._h) ? merger._h : merger._h + 1 | 0;

						newset.push(merger);

						i++;
						didMerge = true;
					} else newset.push(current);
					i++;
				}

				set = newset.length ? Crafty.clone(newset) : set;

				if (didMerge) i = 0;
			} while (didMerge);

			return set;
		},

		/**
		* Calculate the bounding rect of dirty data
		* and add to the register
		*/
		add: function add(old, current) {
			if (!current) {
				dom.push(old);
				return;
			}

			var rect,
				before = old._mbr || old,
				after = current._mbr || current;

			if (old === current) {
				rect = old.mbr() || old.pos();
			} else {
				rect = {
					_x: ~~Math.min(before._x, after._x),
					_y: ~~Math.min(before._y, after._y),
					_w: Math.max(before._w, after._w) + Math.max(before._x, after._x),
					_h: Math.max(before._h, after._h) + Math.max(before._y, after._y)
				};

				rect._w = (rect._w - rect._x);
				rect._h = (rect._h - rect._y);
			}

			if (rect._w === 0 || rect._h === 0 || !this.onScreen(rect)) {
				return false;
			}

			//floor/ceil
			rect._x = ~~rect._x;
			rect._y = ~~rect._y;
			rect._w = (rect._w === ~~rect._w) ? rect._w : rect._w + 1 | 0;
			rect._h = (rect._h === ~~rect._h) ? rect._h : rect._h + 1 | 0;

			//add to register, check for merging
			register.push(rect);

			//if it got merged
			return true;
		},

		debug: function () {
			console.log(register, dom);
		},

		drawAll: function (rect) {
			var rect = rect || Crafty.viewport.rect(), q,
				i = 0, l, ctx = Crafty.canvas.context,
				current;

			q = Crafty.map.search(rect);
			l = q.length;

			ctx.clearRect(rect._x, rect._y, rect._w, rect._h);

			q.sort(function (a, b) { return a._global - b._global; });
			for (; i < l; i++) {
				current = q[i];
				if (current._visible && current.__c.Canvas) {
					current.draw();
					current._changed = false;
				}
			}
		},

		/**
		* Calculate the common bounding rect of multiple canvas entities
		* Returns coords
		*/
		boundingRect: function (set) {
			if (!set || !set.length) return;
			var newset = [], i = 1,
			l = set.length, current, master = set[0], tmp;
			master = [master._x, master._y, master._x + master._w, master._y + master._h];
			while (i < l) {
				current = set[i];
				tmp = [current._x, current._y, current._x + current._w, current._y + current._h];
				if (tmp[0] < master[0]) master[0] = tmp[0];
				if (tmp[1] < master[1]) master[1] = tmp[1];
				if (tmp[2] > master[2]) master[2] = tmp[2];
				if (tmp[3] > master[3]) master[3] = tmp[3];
				i++;
			}
			tmp = master;
			master = { _x: tmp[0], _y: tmp[1], _w: tmp[2] - tmp[0], _h: tmp[3] - tmp[1] };

			return master;
		},

		/**
		* Redraw all the dirty regions
		*/
		draw: function draw() {
			//if nothing in register, stop
			if (!register.length && !dom.length) return;

			var i = 0, l = register.length, k = dom.length, rect, q,
				j, len, dupes, obj, ent, objs = [], ctx = Crafty.canvas.context;

			//loop over all DOM elements needing updating
			for (; i < k; ++i) {
				dom[i].draw()._changed = false;
			}
			//reset counter and DOM array
			dom.length = i = 0;

			//again, stop if nothing in register
			if (!l) { return; }

			//if the amount of rects is over 60% of the total objects
			//do the naive method redrawing
			if (l / this.total2D > 0.6) {
				this.drawAll();
				register.length = 0;
				return;
			}

			register = this.merge(register);
			for (; i < l; ++i) { //loop over every dirty rect
				rect = register[i];
				if (!rect) continue;
				q = Crafty.map.search(rect, false); //search for ents under dirty rect

				dupes = {};

				//loop over found objects removing dupes and adding to obj array
				for (j = 0, len = q.length; j < len; ++j) {
					obj = q[j];

					if (dupes[obj[0]] || !obj._visible || !obj.__c.Canvas)
						continue;
					dupes[obj[0]] = true;

					objs.push({ obj: obj, rect: rect });
				}

				//clear the rect from the main canvas
				ctx.clearRect(rect._x, rect._y, rect._w, rect._h);

			}

			//sort the objects by the global Z
			objs.sort(function (a, b) { return a.obj._global - b.obj._global; });
			if (!objs.length){ return; }

			//loop over the objects
			for (i = 0, l = objs.length; i < l; ++i) {
				obj = objs[i];
				rect = obj.rect;
				ent = obj.obj;

				var area = ent._mbr || ent,
					x = (rect._x - area._x <= 0) ? 0 : ~~(rect._x - area._x),
					y = (rect._y - area._y < 0) ? 0 : ~~(rect._y - area._y),
					w = ~~Math.min(area._w - x, rect._w - (area._x - rect._x), rect._w, area._w),
					h = ~~Math.min(area._h - y, rect._h - (area._y - rect._y), rect._h, area._h);

				//no point drawing with no width or height
				if (h === 0 || w === 0) continue;

				ctx.save();
				ctx.beginPath();
				ctx.moveTo(rect._x, rect._y);
				ctx.lineTo(rect._x + rect._w, rect._y);
				ctx.lineTo(rect._x + rect._w, rect._h + rect._y);
				ctx.lineTo(rect._x, rect._h + rect._y);
				ctx.lineTo(rect._x, rect._y);

				ctx.clip();

				ent.draw();
				ctx.closePath();
				ctx.restore();

				//allow entity to re-register
				ent._changed = false;
			}

			//empty register
			register.length = 0;
			//all merged IDs are now invalid
			merged = {};
		}
	};
})(); Crafty.extend({
/**@
	* #Crafty.isometric
	* @category 2D
	* Place entities in a 45deg isometric fashion.
	*/
	isometric: {
		_tile: {
			width: 0,
			height: 0
		},
		_z: 0,

		/**@
		* #Crafty.isometric.size
		* @comp Crafty.isometric
		* @sign public this Crafty.isometric.size(Number tileSize)
		* @param tileSize - The size of the tiles to place.
		* Method used to initialize the size of the isometric placement.
		* Recommended to use a size alues in the power of `2` (128, 64 or 32).
		* This makes it easy to calculate positions and implement zooming.
		* ~~~
		* var iso = Crafty.isometric.size(128);
		* ~~~
		* @see Crafty.isometric.place
		*/
		size: function (width, height) {
			this._tile.width = width;
			this._tile.height = height;
			return this;
		},

		/**@
		* #Crafty.isometric.place
		* @comp Crafty.isometric
		* @sign public this Crafty.isometric.size(Number x, Number y, Number z, Entity tile)
		* @param x - The `x` position to place the tile
		* @param y - The `y` position to place the tile
		* @param z - The `z` position or height to place the tile
		* @param tile - The entity that should be position in the isometric fashion
		* Use this method to place an entity in an isometric grid.
		* ~~~
		* var iso = Crafty.isometric.size(128);
		* isos.place(2, 1, 0, Crafty.e('2D, DOM, Color').color('red').attr({w:128, h:128}));
		* ~~~
		* @see Crafty.isometric.size
		*/
		place: function (x, y, z, obj) {
			var m = x * this._tile.width + (y & 1) * (this._tile.width / 2),
                	n = y * this._tile.width / 4;
			if (this._tile.height > 0) {
				n = y * this._tile.height / 2;
			}
			n -= z * (this._tile.width / 2);

			obj.attr({ x: m + Crafty.viewport._x, y: n + Crafty.viewport._y }).z += z;
			return this;
		}
	}
}); /**@
* #Particles
* @category Graphics
* Based on Parcycle by Mr. Speaker, licensed under the MIT, Ported by Leo Koppelkamm
* **This is canvas only & won't do anything if the browser doesn't support it!**
* To see how this works take a look in https://github.com/louisstow/Crafty/blob/master/src/particles.js
*/
Crafty.c("particles", {
	init: function () {
		//We need to clone it
		this._Particles = Crafty.clone(this._Particles);
	},
	particles: function (options) {

		if (!Crafty.support.canvas || Crafty.deactivateParticles) return this;

		//If we drew on the main canvas, we'd have to redraw
		//potentially huge sections of the screen every frame
		//So we create a separate canvas, where we only have to redraw
		//the changed particles.
		var c, ctx, relativeX, relativeY, bounding;

		c = document.createElement("canvas");
		c.width = Crafty.viewport.width;
		c.height = Crafty.viewport.height;
		c.style.position = 'absolute';

		Crafty.stage.elem.appendChild(c);

		ctx = c.getContext('2d');

		this._Particles.init(options);

		relativeX = this.x + Crafty.viewport.x;
		relativeY = this.y + Crafty.viewport.y;
		this._Particles.position = this._Particles.vectorHelpers.create(relativeX, relativeY);

		var oldViewport = { x: Crafty.viewport.x, y: Crafty.viewport.y };

		this.bind('EnterFrame', function () {
			relativeX = this.x + Crafty.viewport.x;
			relativeY = this.y + Crafty.viewport.y;
			this._Particles.viewportDelta = { x: Crafty.viewport.x - oldViewport.x, y: Crafty.viewport.y - oldViewport.y };

			oldViewport = { x: Crafty.viewport.x, y: Crafty.viewport.y };

			this._Particles.position = this._Particles.vectorHelpers.create(relativeX, relativeY);

			//Selective clearing
			if (typeof Crafty.DrawManager.boundingRect == 'function') {
				bounding = Crafty.DrawManager.boundingRect(this._Particles.register);
				if (bounding) ctx.clearRect(bounding._x, bounding._y, bounding._w, bounding._h);
			} else {
				ctx.clearRect(0, 0, Crafty.viewport.width, Crafty.viewport.height);
			}

			//This updates all particle colors & positions
			this._Particles.update();

			//This renders the updated particles
			this._Particles.render(ctx);
		});
		return this;
	},
	_Particles: {
		presets: {
			maxParticles: 150,
			size: 18,
			sizeRandom: 4,
			speed: 1,
			speedRandom: 1.2,
			// Lifespan in frames
			lifeSpan: 29,
			lifeSpanRandom: 7,
			// Angle is calculated clockwise: 12pm is 0deg, 3pm is 90deg etc.
			angle: 65,
			angleRandom: 34,
			startColour: [255, 131, 0, 1],
			startColourRandom: [48, 50, 45, 0],
			endColour: [245, 35, 0, 0],
			endColourRandom: [60, 60, 60, 0],
			// Only applies when fastMode is off, specifies how sharp the gradients are drawn
			sharpness: 20,
			sharpnessRandom: 10,
			// Random spread from origin
			spread: 10,
			// How many frames should this last
			duration: -1,
			// Will draw squares instead of circle gradients
			fastMode: false,
			gravity: { x: 0, y: 0.1 },
			// sensible values are 0-3
			jitter: 0,

			//Don't modify the following
			particles: [],
			active: true,
			particleCount: 0,
			elapsedFrames: 0,
			emissionRate: 0,
			emitCounter: 0,
			particleIndex: 0
		},


		init: function (options) {
			this.position = this.vectorHelpers.create(0, 0);
			if (typeof options == 'undefined') var options = {};

			//Create current config by mergin given options and presets.
			for (key in this.presets) {
				if (typeof options[key] != 'undefined') this[key] = options[key];
				else this[key] = this.presets[key];
			}

			this.emissionRate = this.maxParticles / this.lifeSpan;
			this.positionRandom = this.vectorHelpers.create(this.spread, this.spread);
		},

		addParticle: function () {
			if (this.particleCount == this.maxParticles) {
				return false;
			}

			// Take the next particle out of the particle pool we have created and initialize it
			var particle = new this.particle(this.vectorHelpers);
			this.initParticle(particle);
			this.particles[this.particleCount] = particle;
			// Increment the particle count
			this.particleCount++;

			return true;
		},
		RANDM1TO1: function () {
			return Math.random() * 2 - 1;
		},
		initParticle: function (particle) {
			particle.position.x = this.position.x + this.positionRandom.x * this.RANDM1TO1();
			particle.position.y = this.position.y + this.positionRandom.y * this.RANDM1TO1();

			var newAngle = (this.angle + this.angleRandom * this.RANDM1TO1()) * (Math.PI / 180); // convert to radians
			var vector = this.vectorHelpers.create(Math.sin(newAngle), -Math.cos(newAngle)); // Could move to lookup for speed
			var vectorSpeed = this.speed + this.speedRandom * this.RANDM1TO1();
			particle.direction = this.vectorHelpers.multiply(vector, vectorSpeed);

			particle.size = this.size + this.sizeRandom * this.RANDM1TO1();
			particle.size = particle.size < 0 ? 0 : ~~particle.size;
			particle.timeToLive = this.lifeSpan + this.lifeSpanRandom * this.RANDM1TO1();

			particle.sharpness = this.sharpness + this.sharpnessRandom * this.RANDM1TO1();
			particle.sharpness = particle.sharpness > 100 ? 100 : particle.sharpness < 0 ? 0 : particle.sharpness;
			// internal circle gradient size - affects the sharpness of the radial gradient
			particle.sizeSmall = ~~((particle.size / 200) * particle.sharpness); //(size/2/100)
			var start = [
				this.startColour[0] + this.startColourRandom[0] * this.RANDM1TO1(),
				this.startColour[1] + this.startColourRandom[1] * this.RANDM1TO1(),
				this.startColour[2] + this.startColourRandom[2] * this.RANDM1TO1(),
				this.startColour[3] + this.startColourRandom[3] * this.RANDM1TO1()
				];

			var end = [
				this.endColour[0] + this.endColourRandom[0] * this.RANDM1TO1(),
				this.endColour[1] + this.endColourRandom[1] * this.RANDM1TO1(),
				this.endColour[2] + this.endColourRandom[2] * this.RANDM1TO1(),
				this.endColour[3] + this.endColourRandom[3] * this.RANDM1TO1()
				];

			particle.colour = start;
			particle.deltaColour[0] = (end[0] - start[0]) / particle.timeToLive;
			particle.deltaColour[1] = (end[1] - start[1]) / particle.timeToLive;
			particle.deltaColour[2] = (end[2] - start[2]) / particle.timeToLive;
			particle.deltaColour[3] = (end[3] - start[3]) / particle.timeToLive;
		},
		update: function () {
			if (this.active && this.emissionRate > 0) {
				var rate = 1 / this.emissionRate;
				this.emitCounter++;
				while (this.particleCount < this.maxParticles && this.emitCounter > rate) {
					this.addParticle();
					this.emitCounter -= rate;
				}
				this.elapsedFrames++;
				if (this.duration != -1 && this.duration < this.elapsedFrames) {
					this.stop();
				}
			}

			this.particleIndex = 0;
			this.register = [];
			var draw;
			while (this.particleIndex < this.particleCount) {

				var currentParticle = this.particles[this.particleIndex];

				// If the current particle is alive then update it
				if (currentParticle.timeToLive > 0) {

					// Calculate the new direction based on gravity
					currentParticle.direction = this.vectorHelpers.add(currentParticle.direction, this.gravity);
					currentParticle.position = this.vectorHelpers.add(currentParticle.position, currentParticle.direction);
					currentParticle.position = this.vectorHelpers.add(currentParticle.position, this.viewportDelta);
					if (this.jitter) {
						currentParticle.position.x += this.jitter * this.RANDM1TO1();
						currentParticle.position.y += this.jitter * this.RANDM1TO1();
					}
					currentParticle.timeToLive--;

					// Update colours
					var r = currentParticle.colour[0] += currentParticle.deltaColour[0];
					var g = currentParticle.colour[1] += currentParticle.deltaColour[1];
					var b = currentParticle.colour[2] += currentParticle.deltaColour[2];
					var a = currentParticle.colour[3] += currentParticle.deltaColour[3];

					// Calculate the rgba string to draw.
					draw = [];
					draw.push("rgba(" + (r > 255 ? 255 : r < 0 ? 0 : ~~r));
					draw.push(g > 255 ? 255 : g < 0 ? 0 : ~~g);
					draw.push(b > 255 ? 255 : b < 0 ? 0 : ~~b);
					draw.push((a > 1 ? 1 : a < 0 ? 0 : a.toFixed(2)) + ")");
					currentParticle.drawColour = draw.join(",");

					if (!this.fastMode) {
						draw[3] = "0)";
						currentParticle.drawColourEnd = draw.join(",");
					}

					this.particleIndex++;
				} else {
					// Replace particle with the last active
					if (this.particleIndex != this.particleCount - 1) {
						this.particles[this.particleIndex] = this.particles[this.particleCount - 1];
					}
					this.particleCount--;
				}
				var rect = {};
				rect._x = ~~currentParticle.position.x;
				rect._y = ~~currentParticle.position.y;
				rect._w = currentParticle.size;
				rect._h = currentParticle.size;

				this.register.push(rect);
			}
		},

		stop: function () {
			this.active = false;
			this.elapsedFrames = 0;
			this.emitCounter = 0;
		},

		render: function (context) {

			for (var i = 0, j = this.particleCount; i < j; i++) {
				var particle = this.particles[i];
				var size = particle.size;
				var halfSize = size >> 1;

				if (particle.position.x + size < 0
					|| particle.position.y + size < 0
					|| particle.position.x - size > Crafty.viewport.width
					|| particle.position.y - size > Crafty.viewport.height) {
					//Particle is outside
					continue;
				}
				var x = ~~particle.position.x;
				var y = ~~particle.position.y;

				if (this.fastMode) {
					context.fillStyle = particle.drawColour;
				} else {
					var radgrad = context.createRadialGradient(x + halfSize, y + halfSize, particle.sizeSmall, x + halfSize, y + halfSize, halfSize);
					radgrad.addColorStop(0, particle.drawColour);
					//0.9 to avoid visible boxing
					radgrad.addColorStop(0.9, particle.drawColourEnd);
					context.fillStyle = radgrad;
				}
				context.fillRect(x, y, size, size);
			}
		},
		particle: function (vectorHelpers) {
			this.position = vectorHelpers.create(0, 0);
			this.direction = vectorHelpers.create(0, 0);
			this.size = 0;
			this.sizeSmall = 0;
			this.timeToLive = 0;
			this.colour = [];
			this.drawColour = "";
			this.deltaColour = [];
			this.sharpness = 0;
		},
		vectorHelpers: {
			create: function (x, y) {
				return {
					"x": x,
					"y": y
				};
			},
			multiply: function (vector, scaleFactor) {
				vector.x *= scaleFactor;
				vector.y *= scaleFactor;
				return vector;
			},
			add: function (vector1, vector2) {
				vector1.x += vector2.x;
				vector1.y += vector2.y;
				return vector1;
			}
		}
	}
}); Crafty.extend({
/**@
	* #Crafty.audio
	* @category Audio
	* Add sound files and play them. Chooses best format for browser support.
	* Due to the nature of HTML5 audio, three types of audio files will be
	* required for cross-browser capabilities. These formats are MP3, Ogg and WAV.
	*/
	audio: {
		_elems: {},
		_muted: false,

		/**@
		* #Crafty.audio.MAX_CHANNELS
		* @comp Crafty.audio
		* Amount of Audio objects for a sound so overlapping of the
		* same sound can occur. More channels means more of the same sound
		* playing at the same time.
		*/
		MAX_CHANNELS: 5,

		type: {
			'mp3': 'audio/mpeg;',
			'ogg': 'audio/ogg; codecs="vorbis"',
			'wav': 'audio/wav; codecs="1"',
			'mp4': 'audio/mp4; codecs="mp4a.40.2"'
		},

		/**@
		* #Crafty.audio.add
		* @comp Crafty.audio
		* @sign public this Crafty.audio.add(String id, String url)
		* @param id - A string to reffer to sounds
		* @param url - A string pointing to the sound file
		* @sign public this Crafty.audio.add(String id, Array urls)
		* @param urls - Array of urls pointing to different format of the same sound, selecting the first that is playable
		* @sign public this Crafty.audio.add(Object map)
		* @param map - key-value pairs where the key is the `id` and the value is either a `url` or `urls`
		*
		* Loads a sound to be played. Due to the nature of HTML5 audio,
		* three types of audio files will be required for cross-browser capabilities.
		* These formats are MP3, Ogg and WAV.
		*
		* Passing an array of URLs will determine which format the browser can play and select it over any other.
		*
		* Accepts an object where the key is the audio name and
		* either a URL or an Array of URLs (to determine which type to use).
		*
		* The ID you use will be how you refer to that sound when using `Crafty.audio.play`.
		*
		* @example
		* ~~~
		* //adding audio from an object
		* Crafty.audio.add({
		* 	shoot: ["sounds/shoot.wav",
		* 			"sounds/shoot.mp3",
		* 			"sounds/shoot.ogg"],
		*
		* 	coin: "sounds/coin.mp3"
		* });
		*
		* //adding a single sound
		* Crafty.audio.add("walk", [
		* 	"sounds/walk.mp3",
		* 	"sounds/walk.ogg",
		* 	"sounds/walk.wav"
		* ]);
		*
		* //only one format
		* Crafty.audio.add("jump", "sounds/jump.mp3");
		* ~~~
		*/
		add: function (id, url) {
			if (!Crafty.support.audio) return this;

			var elem,
				key,
				audio = new Audio(),
				canplay,
				i = 0,
				sounds = [];

			//if an object is passed
			if (arguments.length === 1 && typeof id === "object") {
				for (key in id) {
					if (!id.hasOwnProperty(key)) continue;

					//if array passed, add fallback sources
					if (typeof id[key] !== "string") {
						var sources = id[key], i = 0, l = sources.length,
							source;

						for (; i < l; ++i) {
							source = sources[i];
							//get the file extension
							ext = source.substr(source.lastIndexOf('.') + 1).toLowerCase();
							canplay = audio.canPlayType(this.type[ext]);

							//if browser can play this type, use it
							if (canplay !== "" && canplay !== "no") {
								url = source;
								break;
							}
						}
					} else {
						url = id[key];
					}

					for (; i < this.MAX_CHANNELS; i++) {
						audio = new Audio(url);
						audio.preload = "auto";
						audio.load();
						sounds.push(audio);
					}
					this._elems[key] = sounds;
					if (!Crafty.assets[url]) Crafty.assets[url] = this._elems[key][0];
				}

				return this;
			}
			//standard method
			if (typeof url !== "string") {
				var i = 0, l = url.length,
					source;

				for (; i < l; ++i) {
					source = url[i];
					//get the file extension
					ext = source.substr(source.lastIndexOf('.') + 1);
					canplay = audio.canPlayType(this.type[ext]);

					//if browser can play this type, use it
					if (canplay !== "" && canplay !== "no") {
						url = source;
						break;
					}
				}
			}

			//create a new Audio object and add it to assets
			for (; i < this.MAX_CHANNELS; i++) {
				audio = new Audio(url);
				audio.preload = "auto";
				audio.load();
				sounds.push(audio);
			}
			this._elems[id] = sounds;
			if (!Crafty.assets[url]) Crafty.assets[url] = this._elems[id][0];

			return this;
		},
		/**@
		* #Crafty.audio.play
		* @comp Crafty.audio
		* @sign public this Crafty.audio.play(String id)
		* @sign public this Crafty.audio.play(String id, Number repeatCount)
		* @param id - A string to reffer to sounds
		* @param repeatCount - Repeat count for the file, where -1 stands for repeat forever.
		*
		* Will play a sound previously added by using the ID that was used in `Crafty.audio.add`.
		* Has a default maximum of 5 channels so that the same sound can play simultaneously unless all of the channels are playing.

		* *Note that the implementation of HTML5 Audio is buggy at best.*
		*
		* @example
		* ~~~
		* Crafty.audio.play("walk");
		*
		* //play and repeat forever
		* Crafty.audio.play("backgroundMusic", -1);
		* ~~~
		*/
		play: function (id, repeat) {
			if (!Crafty.support.audio) return;

			var sounds = this._elems[id],
				sound,
				i = 0, l = sounds.length;

			for (; i < l; i++) {
				sound = sounds[i];
				//go through the channels and play a sound that is stopped
				if (sound.ended || !sound.currentTime) {
					sound.play();
					break;
				} else if (i === l - 1) { //if all sounds playing, try stop the last one
					sound.currentTime = 0;
					sound.play();
				}
			}
			if (typeof repeat == "number") {
				var j = 0;
				//i is still set to the sound we played
				sounds[i].addEventListener('ended', function () {
					if (repeat == -1 || j <= repeat) {
						this.currentTime = 0;
						j++;
					}
				}, false);
			}
			return this;
		},

		/**@
		* #Crafty.audio.settings
		* @comp Crafty.audio
		* @sign public this Crafty.audio.settings(String id, Object settings)
		* @param id - The audio instance added by `Crafty.audio.add`
		* @param settings - An object where the key is the setting and the value is what to modify the setting with
		* Used to modify settings of the HTML5 `Audio` object. For a list of all the settings available,
		* see the [Mozilla Documentation](https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIDOMHTMLMediaElement).
		*/
		settings: function (id, settings) {
			//apply to all
			if (!settings) {
				for (var key in this._elems) {
					this.settings(key, id);
				}
				return this;
			}

			var sounds = this._elems[id],
				sound,
				setting,
				i = 0, l = sounds.length;

			for (var setting in settings) {
				for (; i < l; i++) {
					sound = sounds[i];
					sound[setting] = settings[setting];
				}
			}

			return this;
		},

		/**@
		* #Crafty.audio.mute
		* @sign public this Crafty.audio.mute([Boolean mute])
		* Mute or unmute every Audio instance that is playing. Toggles between
		* pausing or playing depending on the state.
		* @example
		* ~~~
		* //toggle mute and unmute depending on current state
		* Crafty.audio.mute();
		*
		* //mute or unmute no matter what the current state is
		* Crafty.audio.mute(true);
		* Crafty.audio.mute(false);
		* ~~~
		*/
		mute: function (mute) {
			var sounds, sound, i, l, elem;
			this._muted = !this._muted;

			if (arguments.length == 1 && typeof(mute) == "boolean")
				this._muted = mute;

			//loop over every sound
			for (sounds in this._elems) {
				elem = this._elems[sounds];

				//loop over every channel for a sound
				for (i = 0, l = elem.length; i < l; ++i) {
					sound = elem[i];

					//if playing, stop
					if (!sound.ended && sound.currentTime) {
						if (this._muted)
							sound.pause();
						else
							sound.play();
					}
				}
			}
			return this;
		}
	}
});

//stop sounds on Pause
Crafty.bind("Pause", function () { Crafty.audio.mute() });
Crafty.bind("Unpause", function () { Crafty.audio.mute() }); /**@
* #HTML
* @category Graphics
* Component allow for insertion of arbitrary HTML into an entity
*/
Crafty.c("HTML", {
	inner: '',

	init: function () {
		this.requires('2D, DOM');
	},

	/**@
	* #.replace
	* @comp HTML
	* @sign public this .replace(String html)
	* @param html - arbitrary html
	* This method will replace the content of this entity with the supplied html
	*
	* @example
	* Create a link
	* ~~~
	* Crafty.e("HTML")
	*    .attr({x:20, y:20, w:100, h:100})
    *    .replace("<a href='http://www.craftyjs.com'>Crafty.js</a>");
	* ~~~
	*/
	replace: function (new_html) {
		this.inner = new_html;
		this._element.innerHTML = new_html;
		return this;
	},

	/**@
	* #.append
	* @comp HTML
	* @sign public this .append(String html)
	* @param html - arbitrary html
	* This method will add the supplied html in the end of the entity
	*
	* @example
	* Create a link
	* ~~~
	* Crafty.e("HTML")
	*    .attr({x:20, y:20, w:100, h:100})
    *    .append("<a href='http://www.craftyjs.com'>Crafty.js</a>");
	* ~~~
	*/
	append: function (new_html) {
		this.inner += new_html;
		this._element.innerHTML += new_html;
		return this;
	},

	/**@
	* #.prepend
	* @comp HTML
	* @sign public this .prepend(String html)
	* @param html - arbitrary html
	* This method will add the supplied html in the beginning of the entity
	*
	* @example
	* Create a link
	* ~~~
	* Crafty.e("HTML")
	*    .attr({x:20, y:20, w:100, h:100})
    *    .prepend("<a href='http://www.craftyjs.com'>Crafty.js</a>");
	* ~~~
	*/
	prepend: function (new_html) {
		this.inner = new_html + this.inner;
		this._element.innerHTML = new_html + this.inner;
		return this;
	}
}); /**@
 * #Storage
 * @category Utilities
 * Utility to allow data to be saved to a permanent storage solution: IndexedDB, WebSql, localstorage or cookies
 */
/**@
	 * #.open
	 * @comp Storage
	 * @sign .open(String gameName)
	 * @param gameName - a machine readable string to uniquely identify your game
	 * Opens a connection to the database. If the best they have is localstorage or lower, it does nothing
	 *
	 * @example
	 * Open a database
	 * ~~~
	 * Crafty.storage.open('MyGame');
	 * ~~~
	 */

/**@
	 * #.save
	 * @comp Storage
	 * @sign .save(String key, String type, Mixed data)
	 * @param key - A unique key for identifying this piece of data
	 * @param type - 'save' or 'cache'
	 * @param data - Some kind of data.
	 * Saves a piece of data to the database. Can be anything, although entities are preferred.
	 * For all storage methods but IndexedDB, the data will be serialized as a string
	 * During serialization, an entity's SaveData event will be triggered.
	 * Components should implement a SaveData handler and attach the necessary information to the passed object
	 *
	 * @example
	 * Saves an entity to the database
	 * ~~~
	 * var ent = Crafty.e("2D, DOM")
	 *                     .attr({x: 20, y: 20, w: 100, h:100});
	 * Crafty.storage.open('MyGame');
	 * Crafty.storage.save('MyEntity', 'save', ent);
	 * ~~~
	 */

/**@
	 * #.load
	 * @comp Storage
	 * @sign .load(String key, String type)
	 * @param key - A unique key to search for
	 * @param type - 'save' or 'cache'
	 * @param callback - Do things with the data you get back
	 * Loads a piece of data from the database.
	 * Entities will be reconstructed from the serialized string

	 * @example
	 * Loads an entity from the database
	 * ~~~
	 * Crafty.storage.open('MyGame');
	 * Crafty.storage.load('MyEntity', 'save', function (data) { // do things });
	 * ~~~
	 */

/**@
	 * #.getAllKeys
	 * @comp Storage
	 * @sign .getAllKeys(String type)
	 * @param type - 'save' or 'cache'
	 * Gets all the keys for a given type

	 * @example
	 * Gets all the save games saved
	 * ~~~
	 * Crafty.storage.open('MyGame');
	 * var saves = Crafty.storage.getAllKeys('save');
	 * ~~~
	 */

/**@
	 * #.external
	 * @comp Storage
	 * @sign .external(String url)
	 * @param url - URL to an external to save games too
	 * Enables and sets the url for saving games to an external server

	 * @example
	 * Save an entity to an external server
	 * ~~~
	 * Crafty.storage.external('http://somewhere.com/server.php');
	 * Crafty.storage.open('MyGame');
	 * var ent = Crafty.e('2D, DOM')
	 *                     .attr({x: 20, y: 20, w: 100, h:100});
	 * Crafty.storage.save('save01', 'save', ent);
	 * ~~~
	 */

/**@
	 * #SaveData event
	 * @comp Storage
	 * @param data - An object containing all of the data to be serialized
	 * @param prepare - The function to prepare an entity for serialization
	 * Any data a component wants to save when it's serialized should be added to this object.
	 * Straight attribute should be set in data.attr.
	 * Anything that requires a special handler should be set in a unique property.
	 *
	 * @example
	 * Saves the innerHTML of an entity
	 * ~~~
	 * Crafty.e("2D DOM").bind("SaveData", function (data, prepare) {
	 *     data.attr.x = this.x;
	 *     data.attr.y = this.y;
	 *     data.dom = this.element.innerHTML;
	 * });
	 * ~~~
	 */

/**@
	 * #LoadData event
	 * @param data - An object containing all the data that been saved
	 * @param process - The function to turn a string into an entity
	 * Handlers for processing any data that needs more than straight assignment
	 *
	 * Note that data stord in the .attr object is automatically added to the entity.
	 * It does not need to be handled here
	 *
	 * @example
	 * ~~~
	 * Sets the innerHTML from a saved entity
	 * Crafty.e("2D DOM").bind("LoadData", function (data, process) {
	 *     this.element.innerHTML = data.dom;
	 * });
	 * ~~~
	 */

Crafty.storage = (function () {
	var db = null, url, gameName, timestamps = {};

	/*
	 * Processes a retrieved object.
	 * Creates an entity if it is one
	 */
	function process(obj) {
		if (obj.c) {
			var d = Crafty.e(obj.c)
						.attr(obj.attr)
						.trigger('LoadData', obj, process);
			return d;
		}
		else if (typeof obj == 'object') {
			for (var prop in obj) {
				obj[prop] = process(obj[prop]);
			}
		}
		return obj;
	}

	function unserialize(str) {
		if (typeof str != 'string') return null;
		var data = (JSON ? JSON.parse(str) : eval('(' + str + ')'));
		return process(data);
	}

	/* recursive function
	 * searches for entities in an object and processes them for serialization
	 */
	function prep(obj) {
		if (obj.__c) {
			// object is entity
			var data = { c: [], attr: {} };
			obj.trigger("SaveData", data, prep);
			for (var i in obj.__c) {
				data.c.push(i);
			}
			data.c = data.c.join(', ');
			obj = data;
		}
		else if (typeof obj == 'object') {
			// recurse and look for entities
			for (var prop in obj) {
				obj[prop] = prep(obj[prop]);
			}
		}
		return obj;
	}

	function serialize(e) {
		if (JSON) {
			var data = prep(e);
			return JSON.stringify(data);
		}
		else {
			alert("Crafty does not support saving on your browser. Please upgrade to a newer browser.");
			return false;
		}
	}

	// for saving a game to a central server
	function external(setUrl) {
		url = setUrl;
	}

	function openExternal() {
		if (1 && typeof url == "undefined") return;
		// get the timestamps for external saves and compare them to local
		// if the external is newer, load it

		var xml = new XMLHttpRequest();
		xhr.open("POST", url);
		xhr.onreadystatechange = function (evt) {
			if (xhr.readyState == 4) {
				if (xhr.status == 200) {
					var data = eval("(" + xhr.responseText + ")");
					for (var i in data) {
						if (Crafty.storage.check(data[i].key, data[i].timestamp)) {
							loadExternal(data[i].key);
						}
					}
				}
			}
		}
		xhr.send("mode=timestamps&game=" + gameName);
	}

	function saveExternal(key, data, ts) {
		if (1 && typeof url == "undefined") return;
		var xhr = new XMLHttpRequest();
		xhr.open("POST", url);
		xhr.send("mode=save&key=" + key + "&data=" + encodeURIComponent(data) + "&ts=" + ts + "&game=" + gameName);
	}

	function loadExternal(key) {
		if (1 && typeof url == "undefined") return;
		var xhr = new XMLHttpRequest();
		xhr.open("POST", url);
		xhr.onreadystatechange = function (evt) {
			if (xhr.readyState == 4) {
				if (xhr.status == 200) {
					var data = eval("(" + xhr.responseText + ")");
					Crafty.storage.save(key, 'save', data);
				}
			}
		}
		xhr.send("mode=load&key=" + key + "&game=" + gameName);
	}

	/**
	 * get timestamp
	 */
	function ts() {
		var d = new Date();
		return d.getTime();
	}

	// everyone names their object different. Fix that nonsense.
	if (typeof indexedDB != 'object') {
		if (typeof mozIndexedDB == 'object') {
			window.indexedDB = mozIndexedDB;
		}
		if (typeof webkitIndexedDB == 'object') {
			window.indexedDB = webkitIndexedDB;
			window.IDBTransaction = webkitIDBTransaction;
		}
	}

	if (typeof indexedDB == 'object') {

		return {
			open: function (gameName_n) {
				gameName = gameName_n;
				var stores = [];

				if (arguments.length == 1) {
					stores.push('save');
					stores.push('cache');
				}
				else {
					stores = arguments;
					stores.shift();
					stores.push('save');
					stores.push('cache');
				}
				if (db == null) {
					var request = indexedDB.open(gameName, "Database for " + gameName);
					request.onsuccess = function (e) {
						db = e.target.result;
						createStores();
						getTimestamps();
						openExternal();
					};
				}
				else {
					createStores();
					getTimestamps();
					openExternal();
				}

				// get all the timestamps for existing keys
				function getTimestamps() {
					try {
						var trans = db.transaction(['save'], IDBTransaction.READ, 0),
						store = trans.objectStore('save'),
						request = store.getAll();
						request.onsuccess = function (e) {
							var i = 0, a = event.target.result, l = a.length;
							for (; i < l; i++) {
								timestamps[a[i].key] = a[i].timestamp;
							}
						};
					}
					catch (e) {
					}
				}

				function createStores() {
					var request = db.setVersion("1.0");
					request.onsuccess = function (e) {
						for (var i = 0; i < stores.length; i++) {
							var st = stores[i];
							if (db.objectStoreNames.contains(st)) continue;
							db.createObjectStore(st, { keyPath: "key" });
						}
					};
				}
			},

			save: function (key, type, data) {
				if (db == null) {
					setTimeout(function () { Crafty.storage.save(key, type, data); }, 1);
					return;
				}

				var str = serialize(data), t = ts();
				if (type == 'save')	saveExternal(key, str, t);
				try {
					var trans = db.transaction([type], IDBTransaction.READ_WRITE, 0),
					store = trans.objectStore(type),
					request = store.put({
						"data": str,
						"timestamp": t,
						"key": key
					});
				}
				catch (e) {
				}
			},

			load: function (key, type, callback) {
				if (db == null) {
					setTimeout(function () { Crafty.storage.load(key, type, callback); }, 1);
					return;
				}
				try {
					var trans = db.transaction([type], IDBTransaction.READ, 0),
					store = trans.objectStore(type),
					request = store.get(key);
					request.onsuccess = function (e) {
						callback(unserialize(e.target.result.data));
					};
				}
				catch (e) {
				}
			},

			getAllKeys: function (type, callback) {
				if (db == null) {
					setTimeout(function () { Crafty.storage.getAllkeys(type, callback); }, 1);
				}
				try {
					var trans = db.transaction([type], IDBTransaction.READ, 0),
					store = trans.objectStore(type),
					request = store.getCursor(),
					res = [];
					request.onsuccess = function (e) {
						var cursor = e.target.result;
						if (cursor) {
							res.push(cursor.key);
							// 'continue' is a reserved word, so .continue() causes IE8 to completely bark with "SCRIPT1010: Expected identifier".
							cursor['continue']();
						}
						else {
							callback(res);
						}
					};
				}
				catch (e) {
				}
			},

			check: function (key, timestamp) {
				return (timestamps[key] > timestamp);
			},

			external: external
		};
	}
	else if (typeof openDatabase == 'function') {
		return {
			open: function (gameName_n) {
				gameName = gameName_n;
				if (arguments.length == 1) {
					db = {
						save: openDatabase(gameName_n + '_save', '1.0', 'Saves games for ' + gameName_n, 5 * 1024 * 1024),
						cache: openDatabase(gameName_n + '_cache', '1.0', 'Cache for ' + gameName_n, 5 * 1024 * 1024)
					}
				}
				else {
					// allows for any other types that can be thought of
					var args = arguments, i = 0;
					args.shift();
					for (; i < args.length; i++) {
						if (typeof db[args[i]] == 'undefined')
							db[args[i]] = openDatabase(gameName + '_' + args[i], '1.0', type, 5 * 1024 * 1024);
					}
				}

				db['save'].transaction(function (tx) {
					tx.executeSql('SELECT key, timestamp FROM data', [], function (tx, res) {
						var i = 0, a = res.rows, l = a.length;
						for (; i < l; i++) {
							timestamps[a.item(i).key] = a.item(i).timestamp;
						}
					});
				});
			},

			save: function (key, type, data) {
				if (typeof db[type] == 'undefined' && gameName != '') {
					this.open(gameName, type);
				}

				var str = serialize(data), t = ts();
				if (type == 'save')	saveExternal(key, str, t);
				db[type].transaction(function (tx) {
					tx.executeSql('CREATE TABLE IF NOT EXISTS data (key unique, text, timestamp)');
					tx.executeSql('SELECT * FROM data WHERE key = ?', [key], function (tx, results) {
						if (results.rows.length) {
							tx.executeSql('UPDATE data SET text = ?, timestamp = ? WHERE key = ?', [str, t, key]);
						}
						else {
							tx.executeSql('INSERT INTO data VALUES (?, ?, ?)', [key, str, t]);
						}
					});
				});
			},

			load: function (key, type, callback) {
				if (db[type] == null) {
					setTimeout(function () { Crafty.storage.load(key, type, callback); }, 1);
					return;
				}
				db[type].transaction(function (tx) {
					tx.executeSql('SELECT text FROM data WHERE key = ?', [key], function (tx, results) {
						if (results.rows.length) {
							res = unserialize(results.rows.item(0).text);
							callback(res);
						}
					});
				});
			},

			getAllKeys: function (type, callback) {
				if (db[type] == null) {
					setTimeout(function () { Crafty.storage.getAllKeys(type, callback); }, 1);
					return;
				}
				db[type].transaction(function (tx) {
					tx.executeSql('SELECT key FROM data', [], function (tx, results) {
						callback(results.rows);
					});
				});
			},

			check: function (key, timestamp) {
				return (timestamps[key] > timestamp);
			},

			external: external
		};
	}
	else if (typeof window.localStorage == 'object') {
		return {
			open: function (gameName_n) {
				gameName = gameName_n;
			},

			save: function (key, type, data) {
				var k = gameName + '.' + type + '.' + key,
					str = serialize(data),
					t = ts();
				if (type == 'save')	saveExternal(key, str, t);
				window.localStorage[k] = str;
				if (type == 'save')
					window.localStorage[k + '.ts'] = t;
			},

			load: function (key, type, callback) {
				var k = gameName + '.' + type + '.' + key,
					str = window.localStorage[k];

				callback(unserialize(str));
			},

			getAllKeys: function (type, callback) {
				var res = {}, output = [], header = gameName + '.' + type;
				for (var i in window.localStorage) {
					if (i.indexOf(header) != -1) {
						var key = i.replace(header, '').replace('.ts', '');
						res[key] = true;
					}
				}
				for (i in res) {
					output.push(i);
				}
				callback(output);
			},

			check: function (key, timestamp) {
				var ts = window.localStorage[gameName + '.save.' + key + '.ts'];

				return (parseInt(timestamp) > parseInt(ts));
			},

			external: external
		};
	}
	else {
		// default fallback to cookies
		return {
			open: function (gameName_n) {
				gameName = gameName_n;
			},

			save: function (key, type, data) {
				// cookies are very limited in space. we can only keep saves there
				if (type != 'save') return;
				var str = serialize(data), t = ts();
				if (type == 'save')	saveExternal(key, str, t);
				document.cookie = gameName + '_' + key + '=' + str + '; ' + gameName + '_' + key + '_ts=' + t + '; expires=Thur, 31 Dec 2099 23:59:59 UTC; path=/';
			},

			load: function (key, type, callback) {
				if (type != 'save') return;
				var reg = new RegExp(gameName + '_' + key + '=[^;]*'),
					result = reg.exec(document.cookie),
					data = unserialize(result[0].replace(gameName + '_' + key + '=', ''));

				callback(data);
			},

			getAllKeys: function (type, callback) {
				if (type != 'save') return;
				var reg = new RegExp(gameName + '_[^_=]', 'g'),
					matches = reg.exec(document.cookie),
					i = 0, l = matches.length, res = {}, output = [];
				for (; i < l; i++) {
					var key = matches[i].replace(gameName + '_', '');
					res[key] = true;
				}
				for (i in res) {
					output.push(i);
				}
				callback(output);
			},

			check: function (key, timestamp) {
				var header = gameName + '_' + key + '_ts',
					reg = new RegExp(header + '=[^;]'),
					result = reg.exec(document.cookie),
					ts = result[0].replace(header + '=', '');

				return (parseInt(timestamp) > parseInt(ts));
			},

			external: external
		};
	}
	/* template
	return {
		open: function (gameName) {
		},
		save: function (key, type, data) {
		},
		load: function (key, type, callback) {
		},
	}*/
})(); /**@
* #Text
* @category Graphics
* @trigger Change - when the text is changed
* @requires Canvas or DOM
* Component to draw text inside the body of an entity.
*/
Crafty.c("Text", {
	_text: "",
	_textFont: {
		"type": "",
		"weight": "",
		"size": "",
		"family": ""
	},
	ready: true,

	init: function () {
		this.requires("2D");

		this.bind("Draw", function (e) {
			var font = this._textFont["type"] + ' ' + this._textFont["weight"] + ' ' +
                    this._textFont["size"] + ' ' + this._textFont["family"];

			if (e.type === "DOM") {
				var el = this._element,
                    style = el.style;

				style.color = this._textColor;
				style.font = font;
				el.innerHTML = this._text;
			} else if (e.type === "canvas") {
				var context = e.ctx,
                    metrics = null;

				context.save();

				context.fillStyle = this._textColor || "rgb(0,0,0)";
				context.font = font;

				context.translate(this.x, this.y + this.h);
				context.fillText(this._text, 0, 0);

				metrics = context.measureText(this._text);
				this._w = metrics.width;

				context.restore();
			}
		});
	},

	/**@
    * #.text
    * @comp Text
    * @sign public this .text(String text)
    * @sign public this .text(Function textgenerator)
    * @param text - String of text that will be inserted into the DOM or Canvas element.
    * This method will update the text inside the entity.
    * If you use DOM, to modify the font, use the `.css` method inherited from the DOM component.
    *
    * If you need to reference attributes on the entity itself you can pass a function instead of a string.
    * @example
    * ~~~
    * Crafty.e("2D, DOM, Text").attr({ x: 100, y: 100 }).text("Look at me!!");
    *
    * Crafty.e("2D, DOM, Text").attr({ x: 100, y: 100 })
    *     .text(function () { return "My position is " + this._x });
    *
    * Crafty.e("2D, Canvas, Text").attr({ x: 100, y: 100 }).text("Look at me!!");
    *
    * Crafty.e("2D, Canvas, Text").attr({ x: 100, y: 100 })
    *     .text(function () { return "My position is " + this._x });
    * ~~~
    */
	text: function (text) {
		if (!text) return this._text;
		if (typeof(text) == "function")
			this._text = text.call(this);
		else
			this._text = text;
		this.trigger("Change");
		return this;
	},

	/**@
    * #.textColor
    * @comp Text
    * @sign public this .textColor(String color, Number strength)
    * @param color - The color in hexidecimal
    * @param strength - Level of opacity
    *
    * Modify the text color and level of opacity.
    * @example
    * ~~~
    * Crafty.e("2D, DOM, Text").attr({ x: 100, y: 100 }).text("Look at me!!")
    *   .textColor('#FF0000');
    *
    * Crafty.e("2D, Canvas, Text").attr({ x: 100, y: 100 }).text('Look at me!!')
    *   .textColor('#FF0000', 0.6);
    *
    * ~~~
    */
	textColor: function (color, strength) {
		this._strength = strength;
		this._textColor = Crafty.toRGB(color, this._strength);
		this.trigger("Change");
		return this;
	},

	/**@
    * #.textFont
    * @comp Text
    * @sign public this .textFont(String key, * value)
    * @param key - Property of the entity to modify
    * @param value - Value to set the property to
    *
    * @sign public this .textFont(Object map)
    * @param map - Object where the key is the property to modify and the value as the property value
    * @triggers Change
    *
    * Use this method to set font property of the text entity.
    * @example
    * ~~~
    * Crafty.e("2D, DOM, Text").textFont({ type: 'italic', family: 'Arial' });
    * Crafty.e("2D, Canvas, Text").textFont({ size: '20px', weight: 'bold' });
    *
    * Crafty.e("2D, Canvas, Text").textFont("type", "italic");
    * Crafty.e("2D, Canvas, Text").textFont("type"); // italic
    * ~~~
    */
	textFont: function (key, value) {
		if (arguments.length === 1) {
			//if just the key, return the value
			if (typeof key === "string") {
				return this._textFont[key];
			}

			if (typeof key === "object") {
				for (propertyKey in key) {
					this._textFont[propertyKey] = key[propertyKey];
				}
			}
		} else {
			this._textFont[key] = value;
		}

		this.trigger("Change");
		return this;
	}
}); Crafty.extend({
/**@
	* #Crafty.assets
	* @category Assets
	* An object containing every asset used in the current Crafty game.
	* The key is the URL and the value is the `Audio` or `Image` object.
    *
	* If loading an asset, check that it is in this object first to avoid loading twice.
	* @example
	* ~~~
	* var isLoaded = !!Crafty.assets["images/sprite.png"];
	* ~~~
	*/
	assets: {},

	/**@
	* #Crafty.loader
	* @category Assets
	* @sign public void Crafty.load(Array assets, Function onLoad[, Function onProgress, Function onError])
	* @param assets - Array of assets to load (accepts sounds and images)
	* @param onLoad - Callback when the assets are loaded
	* @param onProgress - Callback when an asset is loaded. Contains information about assets loaded
	* @param onError - Callback when an asset fails to load
	* Preloader for all assets. Takes an array of URLs and
	* adds them to the `Crafty.assets` object.
	*
	* The `onProgress` function will be passed on object with information about
	* the progress including how many assets loaded, total of all the assets to
	* load and a percentage of the progress.
    *
	* `onError` will be passed with the asset that couldn't load.
	*
	* @example
	* ~~~
	* Crafty.load(["images/sprite.png", "sounds/jump.mp3"],
	*     function() {
	*         //when loaded
	*         Crafty.scene("main"); //go to main scene
	*     },
	*
	*     function(e) {
	*		  //progress
	*     },
	*
	*     function(e) {
	*	      //uh oh, error loading
	*     }
	* );
	* ~~~
	* @see Crafty.assets
	*/
	load: function (data, oncomplete, onprogress, onerror) {
		var i = 0, l = data.length, current, obj, total = l, j = 0, ext;
		for (; i < l; ++i) {
			current = data[i];
			ext = current.substr(current.lastIndexOf('.') + 1).toLowerCase();

			if (Crafty.support.audio && (ext === "mp3" || ext === "wav" || ext === "ogg" || ext === "mp4")) {
				obj = new Audio(current);
				//Chrome doesn't trigger onload on audio, see http://code.google.com/p/chromium/issues/detail?id=77794
				if (navigator.userAgent.indexOf('Chrome') != -1) j++;
			} else if (ext === "jpg" || ext === "jpeg" || ext === "gif" || ext === "png") {
				obj = new Image();
				obj.src = current;
			} else {
				total--;
				continue; //skip if not applicable
			}

			//add to global asset collection
			this.assets[current] = obj;

			obj.onload = function () {
				++j;

				//if progress callback, give information of assets loaded, total and percent
				if (onprogress) {
					onprogress.call(this, { loaded: j, total: total, percent: (j / total * 100) });
				}
				if (j === total) {
					if (oncomplete) oncomplete();
				}
			};

			//if there is an error, pass it in the callback (this will be the object that didn't load)
			obj.onerror = function () {
				if (onerror) {
					onerror.call(this, { loaded: j, total: total, percent: (j / total * 100) });
				} else {
					j++;
					if (j === total) {
						if (oncomplete) oncomplete();
					}
				}
			};
		}
	},
	/**@
	* #Crafty.modules
	* @category Assets
	* @sign public void Crafty.modules([String repoLocation,] Object moduleMap[, Function onLoad])
	* @param modules - Map of name:version pairs for modules to load
	* @param onLoad - Callback when the modules are loaded
	* Browse the selection of modules on crafty repositories.
	* Downloads and executes the javascript in the specified modules.
	* If no repository is specified it defaults to http://cdn.craftycomponents.com
	*
	* Available repositories:
	*
	* 	- http://cdn.crafty-modules.com
	* 	- http://cdn.craftycomponents.com
    *
	*
	* @example
	* ~~~
	* // Loading from default repository
	* Crafty.modules({ moveto: 'DEV' }, function () {
	*     //module is ready
	*     Crafty.e("MoveTo, 2D, DOM");
	* });
	*
	* // Loading from your own server
	* Crafty.modules({ 'http://mydomain.com/js/mystuff.js': 'DEV' }, function () {
	*     //module is ready
	*     Crafty.e("MoveTo, 2D, DOM");
	* });
	*
	* // Loading from alternative repository
	* Crafty.modules('http://cdn.crafty-modules.com', { moveto: 'DEV' }, function () {
	*     //module is ready
	*     Crafty.e("MoveTo, 2D, DOM");
	* });
	* ~~~
	*
	*/
	modules: function (modulesRepository, moduleMap, oncomplete) {

		if (arguments.length === 2 && typeof modulesRepository === "object") {
			moduleMap = modulesRepository;
			oncomplete = moduleMap;
			modulesRepository = 'http://cdn.craftycomponents.com';
		}

		/*!
		  * $script.js Async loader & dependency manager
		  * https://github.com/ded/script.js
		  * (c) Dustin Diaz, Jacob Thornton 2011
		  * License: MIT
		  */
		var $script = (function () {
			var win = this, doc = document
			, head = doc.getElementsByTagName('head')[0]
			, validBase = /^https?:\/\//
			, old = win.$script, list = {}, ids = {}, delay = {}, scriptpath
			, scripts = {}, s = 'string', f = false
			, push = 'push', domContentLoaded = 'DOMContentLoaded', readyState = 'readyState'
			, addEventListener = 'addEventListener', onreadystatechange = 'onreadystatechange'

			function every(ar, fn, i) {
				for (i = 0, j = ar.length; i < j; ++i) if (!fn(ar[i])) return f
				return 1
			}
			function each(ar, fn) {
				every(ar, function (el) {
					return !fn(el)
				})
			}

			if (!doc[readyState] && doc[addEventListener]) {
				doc[addEventListener](domContentLoaded, function fn() {
					doc.removeEventListener(domContentLoaded, fn, f)
					doc[readyState] = 'complete'
				}, f)
				doc[readyState] = 'loading'
			}

			function $script(paths, idOrDone, optDone) {
				paths = paths[push] ? paths : [paths]
				var idOrDoneIsDone = idOrDone && idOrDone.call
				, done = idOrDoneIsDone ? idOrDone : optDone
				, id = idOrDoneIsDone ? paths.join('') : idOrDone
				, queue = paths.length
				function loopFn(item) {
					return item.call ? item() : list[item]
				}
				function callback() {
					if (!--queue) {
						list[id] = 1
						done && done()
						for (var dset in delay) {
							every(dset.split('|'), loopFn) && !each(delay[dset], loopFn) && (delay[dset] = [])
						}
					}
				}
				setTimeout(function () {
					each(paths, function (path) {
						if (scripts[path]) {
							id && (ids[id] = 1)
							return scripts[path] == 2 && callback()
						}
						scripts[path] = 1
						id && (ids[id] = 1)
						create(!validBase.test(path) && scriptpath ? scriptpath + path + '.js' : path, callback)
					})
				}, 0)
				return $script
			}

			function create(path, fn) {
				var el = doc.createElement('script')
				, loaded = f
				el.onload = el.onerror = el[onreadystatechange] = function () {
					if ((el[readyState] && !(/^c|loade/.test(el[readyState]))) || loaded) return;
					el.onload = el[onreadystatechange] = null
					loaded = 1
					scripts[path] = 2
					fn()
				}
				el.async = 1
				el.src = path
				head.insertBefore(el, head.firstChild)
			}

			$script.get = create

			$script.order = function (scripts, id, done) {
				(function callback(s) {
					s = scripts.shift()
					if (!scripts.length) $script(s, id, done)
					else $script(s, callback)
				}())
			}

			$script.path = function (p) {
				scriptpath = p
			}
			$script.ready = function (deps, ready, req) {
				deps = deps[push] ? deps : [deps]
				var missing = [];
				!each(deps, function (dep) {
					list[dep] || missing[push](dep);
				}) && every(deps, function (dep) { return list[dep] }) ?
				ready() : !function (key) {
					delay[key] = delay[key] || []
					delay[key][push](ready)
					req && req(missing)
				}(deps.join('|'))
				return $script
			}

			$script.noConflict = function () {
				win.$script = old;
				return this
			}

			return $script
		})();

		var modules = [];
		for (var i in moduleMap) {
			if (i.indexOf("http://") != -1)
				modules.push(i)
			else
				modules.push(modulesRepository + '/' + i.toLowerCase() + '-' + moduleMap[i] + '.js');
		}

		$script(modules, function () {
			if (oncomplete) oncomplete();
		});
	}
}); /**@
* #Crafty.math
* @category 2D
* Static functions.
*/
Crafty.math = {
/**@
	 * #Crafty.math.abs
	 * @comp Crafty.math
     * @sign public this Crafty.math.abs(Number n)
     * @param n - Some value.
     * @return Absolute value.
	 * Returns the absolute value.
     */
	abs: function (x) {
		return x < 0 ? -x : x;
	},

	/**@
     * #Crafty.math.amountOf
	 * @comp Crafty.math
	 * @sign public Number Crafty.math.amountOf(Number checkValue, Number minValue, Number maxValue)
     * @param checkValue - Value that should checked with minimum and maximum.
     * @param minValue - Minimum value to check.
     * @param maxValue - Maximum value to check.
     * @return Amount of checkValue compared to minValue and maxValue.
	 * Returns the amount of how much a checkValue is more like minValue (=0)
     * or more like maxValue (=1)
     */
	amountOf: function (checkValue, minValue, maxValue) {
		if (minValue < maxValue)
			return (checkValue - minValue) / (maxValue - minValue);
		else
			return (checkValue - maxValue) / (minValue - maxValue);
	},


	/**@
     * #Crafty.math.clamp
	 * @comp Crafty.math
	 * @sign public Number Crafty.math.clamp(Number value, Number min, Number max)
     * @param value - A value.
     * @param max - Maximum that value can be.
     * @param min - Minimum that value can be.
     * @return The value between minimum and maximum.
	 * Restricts a value to be within a specified range.
     */
	clamp: function (value, min, max) {
		if (value > max)
			return max;
		else if (value < min)
			return min;
		else
			return value;
	},

	/**@
     * Converts angle from degree to radian.
	 * @comp Crafty.math
     * @param angleInDeg - The angle in degree.
     * @return The angle in radian.
     */
	degToRad: function (angleInDeg) {
		return angleInDeg * Math.PI / 180;
	},

	/**@
     * #Crafty.math.distance
	 * @comp Crafty.math
	 * @sign public Number Crafty.math.distance(Number x1, Number y1, Number x2, Number y2)
     * @param x1 - First x coordinate.
     * @param y1 - First y coordinate.
     * @param x2 - Second x coordinate.
     * @param y2 - Second y coordinate.
     * @return The distance between the two points.
	 * Distance between two points.
     */
	distance: function (x1, y1, x2, y2) {
		var squaredDistance = Crafty.math.squaredDistance(x1, y1, x2, y2);
		return Math.sqrt(parseFloat(squaredDistance));
	},

	/**@
     * #Crafty.math.lerp
	 * @comp Crafty.math
	 * @sign public Number Crafty.math.lerp(Number value1, Number value2, Number amount)
     * @param value1 - One value.
     * @param value2 - Another value.
     * @param amount - Amount of value2 to value1.
     * @return Linear interpolated value.
	 * Linear interpolation. Passing amount with a value of 0 will cause value1 to be returned,
     * a value of 1 will cause value2 to be returned.
     */
	lerp: function (value1, value2, amount) {
		return value1 + (value2 - value1) * amount;
	},

	/**@
     * #Crafty.math.negate
	 * @comp Crafty.math
	 * @sign public Number Crafty.math.negate(Number percent)
     * @param percent - If you pass 1 a -1 will be returned. If you pass 0 a 1 will be returned.
     * @return 1 or -1.
	 * Returnes "randomly" -1.
     */
	negate: function (percent) {
		if (Math.random() < percent)
			return -1;
		else
			return 1;
	},

	/**@
     * #Crafty.math.radToDeg
	 * @comp Crafty.math
	 * @sign public Number Crafty.math.radToDeg(Number angle)
     * @param angleInRad - The angle in radian.
     * @return The angle in degree.
	 * Converts angle from radian to degree.
     */
	radToDeg: function (angleInRad) {
		return angleInRad * 180 / Math.PI;
	},

	/**@
     * #Crafty.math.randomElementOfArray
	 * @comp Crafty.math
	 * @sign public Object Crafty.math.randomElementOfArray(Array array)
     * @param array - A specific array.
     * @return A random element of a specific array.
	 * Returns a random element of a specific array.
     */
	randomElementOfArray: function (array) {
		return array[array.length * Math.random()];
	},

	/**@
     * #Crafty.math.randomInt
	 * @comp Crafty.math
	 * @sign public Number Crafty.math.randomInt(Number start, Number end)
     * @param start - Smallest int value that can be returned.
     * @param end - Biggest int value that can be returned.
     * @return A random int.
	 * Returns a random int in within a specific range.
     */
	randomInt: function (start, end) {
		return start + Math.floor((1 + end - start) * Math.random());
	},

	/**@
     * #Crafty.math.randomNumber
	 * @comp Crafty.math
	 * @sign public Number Crafty.math.randomInt(Number start, Number end)
     * @param start - Smallest number value that can be returned.
     * @param end - Biggest number value that can be returned.
     * @return A random number.
	 * Returns a random number in within a specific range.
     */
	randomNumber: function (start, end) {
		return start + (end - start) * Math.random();
	},

	/**@
	 * #Crafty.math.squaredDistance
	 * @comp Crafty.math
	 * @sign public Number Crafty.math.squaredDistance(Number x1, Number y1, Number x2, Number y2)
     * @param x1 - First x coordinate.
     * @param y1 - First y coordinate.
     * @param x2 - Second x coordinate.
     * @param y2 - Second y coordinate.
     * @return The squared distance between the two points.
	 * Squared distance between two points.
     */
	squaredDistance: function (x1, y1, x2, y2) {
		return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
	},

	/**@
     * #Crafty.math.squaredDistance
	 * @comp Crafty.math
	 * @sign public Boolean Crafty.math.withinRange(Number value, Number min, Number max)
     * @param value - The specific value.
     * @param min - Minimum value.
     * @param max - Maximum value.
     * @return Returns true if value is within a specific range.
	 * Check if a value is within a specific range.
     */
	withinRange: function (value, min, max) {
		return (value >= min && value <= max);
	}
};

Crafty.math.Vector2D = (function () {
	/**@
	 * #Crafty.math.Vector2D
	 *
	 * @class This is a general purpose 2D vector class
	 *
	 * Vector2D uses the following form:
	 * <x, y>
	 *
	 * @public
	 * @sign public {Vector2D} Vector2D();
	 * @sign public {Vector2D} Vector2D(Vector2D);
	 * @sign public {Vector2D} Vector2D(Number, Number);
	 * @param {Vector2D|Number=0} x
	 * @param {Number=0} y
	 */
	function Vector2D(x, y) {
		if (x instanceof Vector2D) {
			this.x = x.x;
			this.y = x.y;
		} else if (arguments.length === 2) {
			this.x = x;
			this.y = y;
		} else if (arguments.length > 0)
			throw "Unexpected number of arguments for Vector2D()";
	} // class Vector2D

	Vector2D.prototype.x = 0;
	Vector2D.prototype.y = 0;

	/**@
	 * #.add( )
	 *
	 * Adds the passed vector to this vector
	 *
	 * @public
	 * @sign public {Vector2D} add(Vector2D);
	 * @param {vector2D} vecRH
	 * @returns {Vector2D} this after adding
	 */
	Vector2D.prototype.add = function (vecRH) {
		this.x += vecRH.x;
		this.y += vecRH.y;
		return this;
	} // add( )

	/**@
	 * #.angleBetween( )
	 *
	 * Calculates the angle between the passed vector and this vector, using <0,0> as the point of reference.
	 * Angles returned have the range (−π, π].
	 *
	 * @public
	 * @sign public {Number} angleBetween(Vector2D);
	 * @param {Vector2D} vecRH
	 * @returns {Number} the angle between the two vectors in radians
	 */
	Vector2D.prototype.angleBetween = function (vecRH) {
		return Math.atan2(this.x * vecRH.y - this.y * vecRH.x, this.x * vecRH.x + this.y * vecRH.y);
	} // angleBetween( )

	/**@
	 * #.angleTo( )
	 *
	 * Calculates the angle to the passed vector from this vector, using this vector as the point of reference.
	 *
	 * @public
	 * @sign public {Number} angleTo(Vector2D);
	 * @param {Vector2D} vecRH
	 * @returns {Number} the angle to the passed vector in radians
	 */
	Vector2D.prototype.angleTo = function (vecRH) {
		return Math.atan2(vecRH.y - this.y, vecRH.x - this.x);
	};

	/**@
	 * #.clone( )
	 *
	 * Creates and exact, numeric copy of this vector
	 *
	 * @public
	 * @sign public {Vector2D} clone();
	 * @returns {Vector2D} the new vector
	 */
	Vector2D.prototype.clone = function () {
		return new Vector2D(this);
	} // clone( )

	/**@
	 * #.distance( )
	 *
	 * Calculates the distance from this vector to the passed vector.
	 *
	 * @public
	 * @sign public {Number} distance(Vector2D);
	 * @param {Vector2D} vecRH
	 * @returns {Number} the distance between the two vectors
	 */
	Vector2D.prototype.distance = function (vecRH) {
		return Math.sqrt((vecRH.x - this.x) * (vecRH.x - this.x) + (vecRH.y - this.y) * (vecRH.y - this.y));
	} // distance( )

	/**@
	 * #.distanceSq( )
	 *
	 * Calculates the squared distance from this vector to the passed vector.
	 * This function avoids calculating the square root, thus being slightly faster than .distance( ).
	 *
	 * @public
	 * @sign public {Number} distanceSq(Vector2D);
	 * @param {Vector2D} vecRH
	 * @returns {Number} the squared distance between the two vectors
	 * @see Vector2D.distance( )
	 */
	Vector2D.prototype.distanceSq = function (vecRH) {
		return (vecRH.x - this.x) * (vecRH.x - this.x) + (vecRH.y - this.y) * (vecRH.y - this.y);
	} // distanceSq( )

	/**@
	 * #.divide( )
	 *
	 * Divides this vector by the passed vector.
	 *
	 * @public
	 * @sign public {Vector2D} divide(Vector2D);
	 * @param {Vector2D} vecRH
	 * @returns {Vector2D} this vector after dividing
	 */
	Vector2D.prototype.divide = function (vecRH) {
		this.x /= vecRH.x;
		this.y /= vecRH.y;
		return this;
	} // divide( )

	/**@
	 * #.dotProduct( )
	 *
	 * Calculates the dot product of this and the passed vectors
	 *
	 * @public
	 * @sign public {Number} dotProduct(Vector2D);
	 * @param {Vector2D} vecRH
	 * @returns {Number} the resultant dot product
	 */
	Vector2D.prototype.dotProduct = function (vecRH) {
		return this.x * vecRH.x + this.y * vecRH.y;
	} // dotProduct( )

	/**@
	 * #.equals( )
	 *
	 * Determines if this vector is numerically equivalent to the passed vector.
	 *
	 * @public
	 * @sign public {Boolean} equals(Vector2D);
	 * @param {Vector2D} vecRH
	 * @returns {Boolean} true if the vectors are equivalent
	 */
	Vector2D.prototype.equals = function (vecRH) {
		return vecRH instanceof Vector2D &&
			this.x == vecRH.x && this.y == vecRH.y;
	} // equals( )

	/**@
	 * #.getNormal( )
	 *
	 * Calculates a new right-handed normal vector for the line created by this and the passed vectors.
	 *
	 * @public
	 * @sign public {Vector2D} getNormal([Vector2D]);
	 * @param {Vector2D=<0,0>} [vecRH]
	 * @returns {Vector2D} the new normal vector
	 */
	Vector2D.prototype.getNormal = function (vecRH) {
		if (vecRH === undefined)
			return new Vector2D(-this.y, this.x); // assume vecRH is <0, 0>
		return new Vector2D(vecRH.y - this.y, this.x - vecRH.x).normalize();
	} // getNormal( )

	/**@
	 * #.isZero( )
	 *
	 * Determines if this vector is equal to <0,0>
	 *
	 * @public
	 * @sign public {Boolean} isZero();
	 * @returns {Boolean} true if this vector is equal to <0,0>
	 */
	Vector2D.prototype.isZero = function () {
		return this.x === 0 && this.y === 0;
	} // isZero( )

	/**@
	 * #.magnitude( )
	 *
	 * Calculates the magnitude of this vector.
	 * Note: Function objects in JavaScript already have a 'length' member, hence the use of magnitude instead.
	 *
	 * @public
	 * @sign public {Number} magnitude();
	 * @returns {Number} the magnitude of this vector
	 */
	Vector2D.prototype.magnitude = function () {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	} // magnitude( )

	/**@
	 * #.magnitudeSq( )
	 *
	 * Calculates the square of the magnitude of this vector.
	 * This function avoids calculating the square root, thus being slightly faster than .magnitude( ).
	 *
	 * @public
	 * @sign public {Number} magnitudeSq();
	 * @returns {Number} the square of the magnitude of this vector
	 * @see Vector2D.magnitude( )
	 */
	Vector2D.prototype.magnitudeSq = function () {
		return this.x * this.x + this.y * this.y;
	} // magnitudeSq( )

	/**@
	 * #.multiply( )
	 *
	 * Multiplies this vector by the passed vector
	 *
	 * @public
	 * @sign public {Vector2D} multiply(Vector2D);
	 * @param {Vector2D} vecRH
	 * @returns {Vector2D} this vector after multiplying
	 */
	Vector2D.prototype.multiply = function (vecRH) {
		this.x *= vecRH.x;
		this.y *= vecRH.y;
		return this;
	} // multiply( )

	/**@
	 * #.negate( )
	 *
	 * Negates this vector (ie. <-x,-y>)
	 *
	 * @public
	 * @sign public {Vector2D} negate();
	 * @returns {Vector2D} this vector after negation
	 */
	Vector2D.prototype.negate = function () {
		this.x = -this.x;
		this.y = -this.y;
		return this;
	} // negate( )

	/**@
	 * #.normalize( )
	 *
	 * Normalizes this vector (scales the vector so that its new magnitude is 1)
	 * For vectors where magnitude is 0, <1,0> is returned.
	 *
	 * @public
	 * @sign public {Vector2D} normalize();
	 * @returns {Vector2D} this vector after normalization
	 */
	Vector2D.prototype.normalize = function () {
		var lng = Math.sqrt(this.x * this.x + this.y * this.y);

		if (lng === 0) {
			// default due East
			this.x = 1;
			this.y = 0;
		} else {
			this.x /= lng;
			this.y /= lng;
		} // else

		return this;
	} // normalize( )

	/**@
	 * #.scale( )
	 *
	 * Scales this vector by the passed amount(s)
	 * If scalarY is omitted, scalarX is used for both axes
	 *
	 * @public
	 * @sign public {Vector2D} scale(Number[, Number]);
	 * @param {Number} scalarX
	 * @param {Number} [scalarY]
	 * @returns {Vector2D} this after scaling
	 */
	Vector2D.prototype.scale = function (scalarX, scalarY) {
		if (scalarY === undefined)
			scalarY = scalarX;

		this.x *= scalarX;
		this.y *= scalarY;

		return this;
	} // scale( )

	/**@
	 * #.scaleToMagnitude( )
	 *
	 * Scales this vector such that its new magnitude is equal to the passed value.
	 *
	 * @public
	 * @sign public {Vector2D} scaleToMagnitude(Number);
	 * @param {Number} mag
	 * @returns {Vector2D} this vector after scaling
	 */
	Vector2D.prototype.scaleToMagnitude = function (mag) {
		var k = mag / this.magnitude();
		this.x *= k;
		this.y *= k;
		return this;
	} // scaleToMagnitude( )

	/**@
	 * #.setValues( )
	 *
	 * Sets the values of this vector using a passed vector or pair of numbers.
	 *
	 * @public
	 * @sign public {Vector2D} setValues(Vector2D);
	 * @sign public {Vector2D} setValues(Number, Number);
	 * @param {Number|Vector2D} x
	 * @param {Number} y
	 * @returns {Vector2D} this vector after setting of values
	 */
	Vector2D.prototype.setValues = function (x, y) {
		if (x instanceof Vector2D) {
			this.x = x.x;
			this.y = x.y;
		} else {
			this.x = x;
			this.y = y;
		} // else

		return this;
	} // setValues( )

	/**@
	 * #.subtract( )
	 *
	 * Subtracts the passed vector from this vector.
	 *
	 * @public
	 * @sign public {Vector2D} subtract(Vector2D);
	 * @param {Vector2D} vecRH
	 * @returns {vector2D} this vector after subtracting
	 */
	Vector2D.prototype.subtract = function (vecRH) {
		this.x -= vecRH.x;
		this.y -= vecRH.y;
		return this;
	} // subtract( )

	/**@
	 * #.toString( )
	 *
	 * Returns a string representation of this vector.
	 *
	 * @public
	 * @sign public {String} toString();
	 * @returns {String}
	 */
	Vector2D.prototype.toString = function () {
		return "Vector2D(" + this.x + ", " + this.y + ")";
	} // toString( )

	/**@
	 * #.translate( )
	 *
	 * Translates (moves) this vector by the passed amounts.
	 * If dy is omitted, dx is used for both axes.
	 *
	 * @public
	 * @sign public {Vector2D} translate(Number[, Number]);
	 * @param {Number} dx
	 * @param {Number} [dy]
	 * @returns {Vector2D} this vector after translating
	 */
	Vector2D.prototype.translate = function (dx, dy) {
		if (dy === undefined)
			dy = dx;

		this.x += dx;
		this.y += dy;

		return this;
	} // translate( )

	/**@
	 * #.tripleProduct( )
	 *
	 * Calculates the triple product of three vectors.
	 * triple vector product = b(a•c) - a(b•c)
	 *
	 * @public
	 * @static
	 * @sign public {Vector2D} tripleProduct(Vector2D, Vector2D, Vector2D);
	 * @param {Vector2D} a
	 * @param {Vector2D} b
	 * @param {Vector2D} c
	 * @return {Vector2D} the triple product as a new vector
	 */
	Vector2D.tripleProduct = function (a, b, c) {
		var ac = a.dotProduct(c);
		var bc = b.dotProduct(c);
		return new Crafty.math.Vector2D(b.x * ac - a.x * bc, b.y * ac - a.y * bc);
	};

	return Vector2D;
})();

Crafty.math.Matrix2D = (function () {
	/**@
	 * #Crafty.math.Matrix2D
	 *
	 * @class This is a 2D Matrix2D class. It is 3x3 to allow for affine transformations in 2D space.
	 * The third row is always assumed to be [0, 0, 1].
	 *
	 * Matrix2D uses the following form, as per the whatwg.org specifications for canvas.transform():
	 * [a, c, e]
	 * [b, d, f]
	 * [0, 0, 1]
	 *
	 * @public
	 * @sign public {Matrix2D} new Matrix2D();
	 * @sign public {Matrix2D} new Matrix2D(Matrix2D);
	 * @sign public {Matrix2D} new Matrix2D(Number, Number, Number, Number, Number, Number);
	 * @param {Matrix2D|Number=1} a
	 * @param {Number=0} b
	 * @param {Number=0} c
	 * @param {Number=1} d
	 * @param {Number=0} e
	 * @param {Number=0} f
	 */
	Matrix2D = function (a, b, c, d, e, f) {
		if (a instanceof Matrix2D) {
			this.a = a.a;
			this.b = a.b;
			this.c = a.c;
			this.d = a.d;
			this.e = a.e;
			this.f = a.f;
		} else if (arguments.length === 6) {
			this.a = a;
			this.b = b;
			this.c = c;
			this.d = d;
			this.e = e;
			this.f = f;
		} else if (arguments.length > 0)
			throw "Unexpected number of arguments for Matrix2D()";
	} // class Matrix2D

	Matrix2D.prototype.a = 1;
	Matrix2D.prototype.b = 0;
	Matrix2D.prototype.c = 0;
	Matrix2D.prototype.d = 1;
	Matrix2D.prototype.e = 0;
	Matrix2D.prototype.f = 0;

	/**@
	 * #.apply( )
	 *
	 * Applies the matrix transformations to the passed object
	 *
	 * @public
	 * @sign public {Vector2D} apply(Vector2D);
	 * @param {Vector2D} vecRH - vector to be transformed
	 * @returns {Vector2D} the passed vector object after transforming
	 */
	Matrix2D.prototype.apply = function (vecRH) {
		// I'm not sure of the best way for this function to be implemented. Ideally
		// support for other objects (rectangles, polygons, etc) should be easily
		// addable in the future. Maybe a function (apply) is not the best way to do
		// this...?

		var tmpX = vecRH.x;
		vecRH.x = tmpX * this.a + vecRH.y * this.c + this.e;
		vecRH.y = tmpX * this.b + vecRH.y * this.d + this.f;
		// no need to homogenize since the third row is always [0, 0, 1]

		return vecRH;
	} // apply( )

	/**@
	 * #.clone( )
	 *
	 * Creates an exact, numeric copy of the current matrix
	 *
	 * @public
	 * @sign public {Matrix2D} clone();
	 * @returns {Matrix2D}
	 */
	Matrix2D.prototype.clone = function () {
		return new Matrix2D(this);
	} // clone( )

	/**@
	 * #.combine( )
	 *
	 * Multiplies this matrix with another, overriding the values of this matrix.
	 * The passed matrix is assumed to be on the right-hand side.
	 *
	 * @public
	 * @sign public {Matrix2D} combine(Matrix2D);
	 * @param {Matrix2D} mtrxRH
	 * @returns {Matrix2D} this matrix after combination
	 */
	Matrix2D.prototype.combine = function (mtrxRH) {
		var tmp = this.a;
		this.a = tmp * mtrxRH.a + this.b * mtrxRH.c;
		this.b = tmp * mtrxRH.b + this.b * mtrxRH.d;
		tmp = this.c;
		this.c = tmp * mtrxRH.a + this.d * mtrxRH.c;
		this.d = tmp * mtrxRH.b + this.d * mtrxRH.d;
		tmp = this.e;
		this.e = tmp * mtrxRH.a + this.f * mtrxRH.c + mtrxRH.e;
		this.f = tmp * mtrxRH.b + this.f * mtrxRH.d + mtrxRH.f;
		return this;
	} // combine( )

	/**@
	 * #.equals( )
	 *
	 * Checks for the numeric equality of this matrix versus another.
	 *
	 * @public
	 * @sign public {Boolean} equals(Matrix2D);
	 * @param {Matrix2D} mtrxRH
	 * @returns {Boolean} true if the two matrices are numerically equal
	 */
	Matrix2D.prototype.equals = function (mtrxRH) {
		return mtrxRH instanceof Matrix2D &&
			this.a == mtrxRH.a && this.b == mtrxRH.b && this.c == mtrxRH.c &&
			this.d == mtrxRH.d && this.e == mtrxRH.e && this.f == mtrxRH.f;
	} // equals( )

	/**@
	 * #.determinant( )
	 *
	 * Calculates the determinant of this matrix
	 *
	 * @public
	 * @sign public {Number} determinant();
	 * @returns {Number} det(this matrix)
	 */
	Matrix2D.prototype.determinant = function () {
		return this.a * this.d - this.b * this.c;
	} // determinant( )

	/**@
	 * #.invert( )
	 *
	 * Inverts this matrix if possible
	 *
	 * @public
	 * @sign public {Matrix2D} invert();
	 * @returns {Matrix2D} this inverted matrix or the original matrix on failure
	 * @see Matrix2D.isInvertible( )
	 */
	Matrix2D.prototype.invert = function () {
		var det = this.determinant();

		// matrix is invertible if its determinant is non-zero
		if (det !== 0) {
			var old = {
				a: this.a,
				b: this.b,
				c: this.c,
				d: this.d,
				e: this.e,
				f: this.f
			};
			this.a = old.d / det;
			this.b = -old.b / det;
			this.c = -old.c / det;
			this.d = old.a / det;
			this.e = (old.c * old.f - old.e * old.d) / det;
			this.f = (old.e * old.b - old.a * old.f) / det;
		} // if

		return this;
	} // invert( )

	/**@
	 * #.isIdentity( )
	 *
	 * Returns true if this matrix is the identity matrix
	 *
	 * @public
	 * @sign public {Boolean} isIdentity();
	 * @returns {Boolean}
	 */
	Matrix2D.prototype.isIdentity = function () {
		return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0;
	} // isIdentity( )

	/**@
	 * #.isInvertible( )
	 *
	 * Determines is this matrix is invertible.
	 *
	 * @public
	 * @sign public {Boolean} isInvertible();
	 * @returns {Boolean} true if this matrix is invertible
	 * @see Matrix2D.invert( )
	 */
	Matrix2D.prototype.isInvertible = function () {
		return this.determinant() !== 0;
	} // isInvertible( )

	/**@
	 * #.preRotate( )
	 *
	 * Applies a counter-clockwise pre-rotation to this matrix
	 *
	 * @public
	 * @sign public {Matrix2D} preRotate(Number);
	 * @param {number} rads - angle to rotate in radians
	 * @returns {Matrix2D} this matrix after pre-rotation
	 */
	Matrix2D.prototype.preRotate = function (rads) {
		var nCos = Math.cos(rads);
		var nSin = Math.sin(rads);

		var tmp = this.a;
		this.a = nCos * tmp - nSin * this.b;
		this.b = nSin * tmp + nCos * this.b;
		tmp = this.c;
		this.c = nCos * tmp - nSin * this.d;
		this.d = nSin * tmp + nCos * this.d;

		return this;
	} // preRotate( )

	/**@
	 * #.preScale( )
	 *
	 * Applies a pre-scaling to this matrix
	 *
	 * @public
	 * @sign public {Matrix2D} preScale(Number[, Number]);
	 * @param {Number} scalarX
	 * @param {Number} [scalarY] scalarX is used if scalarY is undefined
	 * @returns {Matrix2D} this after pre-scaling
	 */
	Matrix2D.prototype.preScale = function (scalarX, scalarY) {
		if (scalarY === undefined)
			scalarY = scalarX;

		this.a *= scalarX;
		this.b *= scalarY;
		this.c *= scalarX;
		this.d *= scalarY;

		return this;
	} // preScale( )

	/**@
	 * #.preTranslate( )
	 *
	 * Applies a pre-translation to this matrix
	 *
	 * @public
	 * @sign public {Matrix2D} preTranslate(Vector2D);
	 * @sign public {Matrix2D} preTranslate(Number, Number);
	 * @param {Number|Vector2D} dx
	 * @param {Number} dy
	 * @returns {Matrix2D} this matrix after pre-translation
	 */
	Matrix2D.prototype.preTranslate = function (dx, dy) {
		if (typeof dx === "number") {
			this.e += dx;
			this.f += dy;
		} else {
			this.e += dx.x;
			this.f += dx.y;
		} // else

		return this;
	} // preTranslate( )

	/**@
	 * #.rotate( )
	 *
	 * Applies a counter-clockwise post-rotation to this matrix
	 *
	 * @public
	 * @sign public {Matrix2D} rotate(Number);
	 * @param {Number} rads - angle to rotate in radians
	 * @returns {Matrix2D} this matrix after rotation
	 */
	Matrix2D.prototype.rotate = function (rads) {
		var nCos = Math.cos(rads);
		var nSin = Math.sin(rads);

		var tmp = this.a;
		this.a = nCos * tmp - nSin * this.b;
		this.b = nSin * tmp + nCos * this.b;
		tmp = this.c;
		this.c = nCos * tmp - nSin * this.d;
		this.d = nSin * tmp + nCos * this.d;
		tmp = this.e;
		this.e = nCos * tmp - nSin * this.f;
		this.f = nSin * tmp + nCos * this.f;

		return this;
	} // rotate( )

	/**@
	 * #.scale( )
	 *
	 * Applies a post-scaling to this matrix
	 *
	 * @public
	 * @sign public {Matrix2D} scale(Number[, Number]);
	 * @param {Number} scalarX
	 * @param {Number} [scalarY] scalarX is used if scalarY is undefined
	 * @returns {Matrix2D} this after post-scaling
	 */
	Matrix2D.prototype.scale = function (scalarX, scalarY) {
		if (scalarY === undefined)
			scalarY = scalarX;

		this.a *= scalarX;
		this.b *= scalarY;
		this.c *= scalarX;
		this.d *= scalarY;
		this.e *= scalarX;
		this.f *= scalarY;

		return this;
	} // scale( )

	/**@
	 * #.setValues( )
	 *
	 * Sets the values of this matrix
	 *
	 * @public
	 * @sign public {Matrix2D} setValues(Matrix2D);
	 * @sign public {Matrix2D} setValues(Number, Number, Number, Number, Number, Number);
	 * @param {Matrix2D|Number} a
	 * @param {Number} b
	 * @param {Number} c
	 * @param {Number} d
	 * @param {Number} e
	 * @param {Number} f
	 * @returns {Matrix2D} this matrix containing the new values
	 */
	Matrix2D.prototype.setValues = function (a, b, c, d, e, f) {
		if (a instanceof Matrix2D) {
			this.a = a.a;
			this.b = a.b;
			this.c = a.c;
			this.d = a.d;
			this.e = a.e;
			this.f = a.f;
		} else {
			this.a = a;
			this.b = b;
			this.c = c;
			this.d = d;
			this.e = e;
			this.f = f;
		} // else

		return this;
	} // setValues( )

	/**@
	 * #.toString( )
	 *
	 * Returns the string representation of this matrix.
	 *
	 * @public
	 * @sign public {String} toString();
	 * @returns {String}
	 */
	Matrix2D.prototype.toString = function () {
		return "Matrix2D([" + this.a + ", " + this.c + ", " + this.e +
			"] [" + this.b + ", " + this.d + ", " + this.f + "] [0, 0, 1])";
	} // toString( )

	/**@
	 * #.translate( )
	 *
	 * Applies a post-translation to this matrix
	 *
	 * @public
	 * @sign public {Matrix2D} translate(Vector2D);
	 * @sign public {Matrix2D} translate(Number, Number);
	 * @param {Number|Vector2D} dx
	 * @param {Number} dy
	 * @returns {Matrix2D} this matrix after post-translation
	 */
	Matrix2D.prototype.translate = function (dx, dy) {
		if (typeof dx === "number") {
			this.e += this.a * dx + this.c * dy;
			this.f += this.b * dx + this.d * dy;
		} else {
			this.e += this.a * dx.x + this.c * dx.y;
			this.f += this.b * dx.x + this.d * dx.y;
		} // else

		return this;
	} // translate( )

	return Matrix2D;
})();
 })(Crafty,window,window.document);