/// <reference path="//Microsoft.WinJS.1.0/js/base.js" />
/// <reference path="/jquery/jquery-1.7.2.js" />
; (function (global, $, undefined) {
    "use strict";
    var win = WinJS,
        define = win.Class.define,
        derive = win.Class.derive,
        mix = win.Class.mix,
        namespace = win.Namespace.define,
        utilities = win.Utilities,
        STRING = "string",
        NUMBER = "number",
        BOOLEAN = "boolean",
        DATE = "date",
        ARRAY = "array",
        OBJECT = "object",
        FUNCTION = "function",
        REGEXP = "regexp",
        NULL = null,
        NOOP = function () { },
        DOT = ".",
        RADIX = 10,
        extend = $.extend,
        getProto = Object.getPrototypeOf,
        keys = Object.keys,
        prop = Object.defineProperty,
        telerik = namespace("Telerik", {
            Error: derive(Error, function (name, message) {
                /// <summary>
                /// Represents a Telerik-specific error with a name and message
                /// </summary>
 })
        }),
        localization = namespace("Telerik.Localization", {
            cultures: {
                "en-US": {
                }
            },
            _strings: {
                elementIsInvalid: "Invalid argument: the control expects a valid DOM element as the first argument."
            }
        }),
        util = namespace("Telerik.Utilities", {
            getPropertyValue: function (obj, property) {
                /// <summary>
                /// Retrieves a property value from an object. Supports retrieving sub-properties.
                /// </summary>
                /// <param name="obj" type="Object">The object whose property to retrieve.</param>
                /// <param name="property" type="String">The name of the property to retrieve.</param>
                /// <returns type="Object">The property value</returns>
                if (property.indexOf(DOT) > 0) {
                    var props = property.split(DOT),
                        sub = obj;
                    while (props.length > 1) {
                        var prop = props.shift();
                        if (typeof sub[prop] !== OBJECT) {
                            return undefined
                        }
                        sub = sub[prop];
                    }
                    return sub[props.shift()];
                }
                return obj[property];
            },
            setPropertyValue: function (obj, property, value) {
                /// <summary>
                /// Sets the specified value to a property. Supports setting sub-property values.
                /// </summary>
                /// <param name="obj" type="Object">The object whose property will be set.</param>
                /// <param name="property" type="String">The name of the property to set.</param>
                /// <param name="value" type="Object">The value to set.</param>
                if (property.indexOf(DOT) > 0) {
                    var props = property.split(DOT),
                        sub = obj;
                    while (props.length > 1) {
                        var prop = props.shift();
                        if (typeof sub[prop] !== OBJECT) {
                            sub[prop] = {};
                        }
                        sub = sub[prop];
                    }
                    sub[props.shift()] = value;
                }
                else {
                    obj[property] = value;
                }
            },
            getType: function (value) {
                /// <summary>
                /// Returns the type of the specified value as a string.
                /// </summary>
                /// <param name="value">The value whose type to retreive</param>
                /// <returns type="String">The type name string</returns>
                return Object.prototype.toString.call(value).split(" ")[1].split("]")[0].toLowerCase();
            },
            setPrivate: function (obj, property, value, writable) {
                /// <summary>
                /// Creates or assignes a private property (enumerable=false) to an object)
                /// </summary>
                /// <param name="obj" type="Object">The object that will receive the property.</param>
                /// <param name="property" type="String">The name of the property.</param>
                /// <param name="value" type="Object">The value of the property.</param>
                /// <param name="writable" type="Boolean" optional="true">Optional. Indicates whether the property should be writable. Default is read-only.</param>
                /// <returns type="Object">The value, which was set</returns>
                var desc = Object.getOwnPropertyDescriptor(obj, property);
                if (desc) {
                    obj[property] = value;
                }
                else {
                    prop(obj, property, {
                        value: value,
                        writable: !!writable
                    });
                }
                return value;
            },
            merge: function (to, from) {
                /// <summary>
                /// Recursively merges properties from a source object to a target object. If a source property is
                /// an array, copies the array to the target object.
                /// </summary>
                /// <param name="to" type="Object">The target object that will receive the properties of the source.</param>
                /// <param name="from" type="Object">The source object that will have its properties recursively copied.</param>
                var target = arguments[0] || {};
                //support arbitrary number of arguments to merge
                for (var i = 1, len = arguments.length; i < len; i++) {
                    var source = arguments[i];
                    if (this.getType(source) !== OBJECT) {
                        continue;
                    }
                    for (var key in source) {
                        var sourceValue = source[key],
                            targetValue = target[key],
                            sourceType = this.getType(sourceValue),
                            targetType = this.getType(targetValue);
                        //break never-ending loop
                        if (sourceValue === targetValue) {
                            continue;
                        }
                        //recursively merge properties of inner objects
                        if (sourceType === OBJECT) {
                            if (targetType !== OBJECT) {
                                targetValue = target[key] = {};
                            }
                            this.merge(targetValue, sourceValue);
                        }
                            //if value is non-null copy directly to target (incl. arrays)
                        else if (sourceValue != NULL) {
                            target[key] = sourceValue;
                        }
                    }
                }
                return target;
            }
        }),
        priv = util.setPrivate,
        ui = namespace("Telerik.UI"),
        common = namespace("Telerik.UI.Common", {
            EventBase: define(function (type, target, extended) {
                /// <summary>
                /// Represents an event object for an event thrown by a control.
                /// </summary>
                /// <param name="type" type="String">The type (name) of the event.</param>
                /// <param name="target" type="Object">The event target object.</param>
                /// <param name="extended" type="Object">An object specifying additional details for this event.</param>
                var that = this,
                    proto = that.constructor.prototype;
                that.type = type;
                that.target = target;
                that.timeStamp = Date.now();
                priv(that, "_preventDefaultCalled", false, true);
                priv(that, "_stopImmediatePropagationCalled", false, true);
                if (extended) {
                    var added = {};
                    keys(extended).forEach(function (key) {
                        if (!proto.hasOwnProperty(key)) {
                            added[key] = {
                                value: extended[key],
                                writable: true,
                                enumerable: true,
                                configurable: false
                            }
                        }
                    });
                    if (keys(added).length) {
                        Object.defineProperties(that, added);
                    }
                }
            }, {
                target: NULL,
                timeStamp: NULL,
                type: NULL,
                bubbles: { value: false, writable: false },
                cancelable: { value: false, writable: false },
                trusted: { value: false, writable: false },
                eventPhase: { value: 0, writable: false },
                currentTarget: {
                    get: function () { return this.target; }
                },
                defaultPrevented: {
                    get: function () { return this._preventDefaultCalled; }
                },
                isDefaultPrevented: function () {
                    return this._preventDefaultCalled;
                },
                preventDefault: function () {
                    this._preventDefaultCalled = true;
                },
                stopImmediatePropagation: function () {
                    this._stopImmediatePropagationCalled = true;
                },
                stopPropagation: function () {
                }
            }),
            eventMixin: {
                addEventListener: function (type, listener, useCapture) {
                    /// <summary>
                    /// Adds an event listener that will be called when the specified event is raised.
                    /// </summary>
                    /// <param name="type" type="string">The type (name) of the event.</param>
                    /// <param name="listener" type="function">The listener to invoke when the event gets raised.</param>
                    /// <param name="useCapture" type="boolean">If true, initiates capture, otherwise false.</param>
                    var that = this,
                        events = that._events ? that._events : priv(that, "_events", {}),
                        listeners = (events[type] = events[type] || []);
                    for (var i = 0, len = listeners.length; i < len; i++) {
                        var item = listeners[i];
                        if (item.capture === !!useCapture && item.handler === listener) {
                            return;
                        }
                    }
                    listeners.push({ capture: !!useCapture, handler: listener });
                },
                removeEventListener: function (type, listener, useCapture) {
                    /// <summary>
                    /// Removes an event listener for the specified event.
                    /// </summary>
                    /// <param name="type" type="string">The type (name) of the event.</param>
                    /// <param name="listener" type="function">The listener to remove.</param>
                    /// <param name="useCapture" type="boolean">Specifies a capturing listener.</param>
                    var that = this,
                        events = that._events ? that._events : priv(that, "_events", {}),
                        listeners = events[type];
                    if (listeners) {
                        for (var i = 0, len = listeners.length; i < len; i++) {
                            var item = listeners[i];
                            if (item.handler === listener && item.capture === !!useCapture) {
                                listeners.splice(i, 1);
                                if (!listeners.length) {
                                    delete events[type];
                                }
                                break;
                            }
                        }
                    }
                },
                dispatchEvent: function (type, details) {
                    /// <summary>
                    /// Raises an event of the specified type and with the specified additional properties.
                    /// </summary>
                    /// <param name="type" type="string">The type (name) of the event.</param>
                    /// <param name="details" type="object">The event details object.</param>
                    var that = this,
                        events = that._events ? that._events : priv(that, "_events", {}),
                        listeners = events[type];
                    if (listeners) {
                        var listenersCopy = listeners.slice(0, listeners.length),
                            evt = new common.EventBase(type, that, details);
                        for (var i = 0, len = listenersCopy.length; i < len && !evt._stopImmediatePropagationCalled; i++) {
                            listenersCopy[i].handler(evt);
                        }
                        return evt.defaultPrevented;
                    }
                    return false;
                }
            }
        });
        /// <summary>
        /// Serves as a base class for all Telerik.UI controls.
        /// </summary>
        /// <excludetoc />
    var Control = define(function (element, options) {
        /// <summary>
        /// Internal use only.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
        /// <param name="options" type="Object">The initialization options for this control.</param>
}, {
        /// <field type="HTMLElement" domElement="true" hidden="true">
        /// Gets the DOM element that hosts this control.
        /// </field>
        element: NULL
    });
    mix(Control, common.eventMixin);
    function isControlConfigurationType(func) {
        var proto = func.prototype;
        while (proto) {
            if (proto === _ControlConfiguration.prototype) {
                return true;
            }
            proto = getProto(proto);
        }
        return false;
    }
    //check if the specified object is an instance of WinJS.Binding.List or a
    //WinJS.Binding.List.dataSource instance and retrieve the list object
    function getBindingList(dataSource) {
        if (dataSource instanceof WinJS.Binding.List) {
            return dataSource;
        }
        else if (dataSource && typeof dataSource.createListBinding === FUNCTION && dataSource.list instanceof win.Binding.List) {
            return dataSource.list;
        }
        return undefined;
    }
    //convert options received from data-win-options attributes
    //into plain objects that can recognize configuration type definitions
    //like { prop: { type:Telerik.UI._ControlConfiguration } }
    function convertOptions(options) {
        var value,
            type = util.getType(options);
        if (type === OBJECT) {
            if (options instanceof telerik.Data.DataSource || getBindingList(options)) {
                return options;
            }
            else if (options instanceof _ControlConfiguration) {
                return options._toOption();
            }
            else if (options && typeof options.type === FUNCTION && isControlConfigurationType(options.type)) {
                    //return (new options.type(options))._toOption();
                var config = new options.type();
                config._modified = options;
                return config._toOption();
            }
            else {
                value = {};
                for (var key in options) {
                    value[key] = convertOptions(options[key]);
                }
            }
        }
        else if (type === ARRAY) {
            value = [];
            for (var key in options) {
                value[key] = convertOptions(options[key]);
            }
        }
        else {
            value = options;
        }
        return value;
    }
    //gathers all properties of type object from all prototypes in the prototype chain
    function mergeAcrossPrototypes(obj, property) {
        var value = obj[property];
        if (typeof value === OBJECT) {
            var proto = obj.constructor.prototype;
            while (proto) {
                var protoValue = proto[property];
                if (protoValue !== value && typeof protoValue === OBJECT && keys(protoValue).length) {
                    value = extend(true, {}, protoValue, value);
                }
                proto = getProto(proto);
            }
        }
        return value;
    }
    function isHandlerRegistered(component, eventName, handler) {
        var handlers = ((component._events || {})[eventName]) || [];
        for (var i = 0, len = handlers.length; i < len; i++) {
            if (handlers[i].handler === handler) {
                return true;
            }
        }
        return false;
    }
    function mapDataSourceEvents(wrapper, dataSourceOptions) {
        var map = Telerik.Data.DataSource.prototype._eventsMap;
        keys(map).forEach(function (eventName) {
            var shortEventName = eventName.substr(2),
                handler = dataSourceOptions[eventName];
            if (typeof handler === FUNCTION) {
                //register an event handler to the kendo.data.DataSource
                dataSourceOptions[map[eventName]] = function (e) {
                    //register and dispatch the event through the DataSource component
                    var dataSource = wrapper.dataSource;
                    if (!dataSource) {
                        dataSource = new Telerik.Data.DataSource(e.sender);
                        priv(wrapper, "_dataSource", dataSource, true);
                    }
                    //if the handler is not already registered for this event,
                    //register it and call the handler this time only
                    if (!isHandlerRegistered(dataSource, shortEventName, handler)) {
                        dataSource.addEventListener(shortEventName, handler);
                        dataSource.dispatchEvent.bind(dataSource, shortEventName).apply(dataSource, arguments);
                    }
                }
                //delete original field (eg."ondatabinding"), as now we have "dataBinding" in its place going to the widget
                delete dataSourceOptions[eventName];
            }
        });
    }
        /// <excludetoc />
    var WidgetWrapper = derive(Control, function (element, options) {
        /// <summary>
        /// Serves as a base class for all widget wrapper controls.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
        /// <param name="options" type="Object">The initialization options for this control.</param>
}, {
        });
        ///<excludetoc />
    var _ControlConfiguration = define(function (owner, parentMapping, defaults, onchange) {
        /// <summary>
        /// For internal usage only.
        /// </summary>
}, {
        }, {
        createGetter: function (key, defaultValue) {
            return function () {
                var that = this;
                if (!that._initialized) {
                    return defaultValue;
                }
                var owner = that instanceof WidgetWrapper ? that : that._owner,
                    widget = owner && owner._widget ? owner._widget : NULL,
                    value = that._modified[key],
                    def = that._defaults[key] !== undefined ? that._defaults[key] : defaultValue,
                    mappedKey = (that._optionsMap || {})[key] || key;
                if (value !== undefined) {
                    return value;
                }
                if (typeof def === FUNCTION) {
                    def = def.call(that, key);
                }
                if (!widget) {
                    if (that._seriesOption) {
                        //value = that._seriesOption[key];
                        value = util.getPropertyValue(that._seriesOption, mappedKey);
                        if (value !== undefined) {
                            return value;
                        }
                    }
                    value = def;
                }
                else {
                    //var mapping = that._optionsMap[key] ? that._optionsMap[key] : that._parentMapping ? that._parentMapping + "." + key : key;
                    var mapping = that._parentMapping ? that._parentMapping + "." + mappedKey : mappedKey;
                    value = util.getPropertyValue(widget.options, mapping);
                    if (value === undefined) {
                        value = def;
                    }
                }
                if (value === defaultValue && util.getType(value) === ARRAY) {
                    value = that._modified[key] = Array.apply(NULL, value);
                }
                return value;
            }
        },
        createSetter: function (key) {
            return function (value) {
                var that = this,
                    oldValue = that[key],
                    value = _ControlConfiguration.validate(that._validators || {}, key, value, oldValue);
                //quit if validation fails or value is default
                if (value === undefined || value === oldValue) {
                    return;
                }
                that._modified[key] = value;
                if (that._onchange) {
                    that._onchange({
                        key: key,
                        value: value,
                        oldValue: oldValue
                    });
                }
            }
        },
        defineProperty: function (key, defaultValue) {
            return {
                get: _ControlConfiguration.createGetter(key, defaultValue),
                set: _ControlConfiguration.createSetter(key),
                enumerable: true,
                configurable: false
            }
        },
        convert: function (value, type) {
            var currentType = util.getType(value);
            if (currentType !== type) {
                if (type === STRING) {
                    value = value + "";
                }
                else if (type === NUMBER) {
                    value = parseFloat(value);
                    if (isNaN(value)) {
                        return; //invalid value
                    }
                }
                else if (type === BOOLEAN) {
                    value = !!value;
                }
                else {
                    //all other type mismatches are invalid
                    return;
                }
            }
            return value;
        },
        validate: function (validators, key, value, oldValue) {
            var that = this,
                type = util.getType(value),
                defaultType = util.getType(oldValue),
                validator = util.getPropertyValue(validators, key),
                isTypeValidator = validator && validator.hasOwnProperty("type");
            if (type !== defaultType && !isTypeValidator) {
                //try to convert between types to get value in required type.
                //DO NOT convert if there is a type validator for this property.
                //We will validate the type further down.
                value = that.convert(value, defaultType);
            }
            if (value === undefined) {
                return;
            }
            //validate converted value, if a validator is registered for this property
            if (validator) {
                if (isTypeValidator) {
                    var allowedTypes = util.getType(validator.type) === ARRAY ? validator.type : [validator.type],
                        typeValid = false;
                    for (var i = 0, len = allowedTypes.length; i < len; i++) {
                        if (type === allowedTypes[i]) {
                            typeValid = true;
                            break;
                        }
                        var converted = that.convert(value, allowedTypes[i]);
                        if (converted !== undefined) {
                            typeValid = true;
                            value = converted;
                            break;
                        }
                    }
                    if (!typeValid) {
                        return; //value type not among accepted types
                    }
                }
                else {
                    var validatorType = util.getType(validator);
                    if (validatorType === ARRAY && validator.indexOf(value) < 0) {
                        return; //value not in the set of valid values
                    }
                    else if (validatorType === FUNCTION) {
                        return validator(value); //validate through a custom function
                    }
                    else if (validatorType === REGEXP) {
                        if (!validator.test(value)) {
                            return; //value does not match regular expression
                        }
                    }
                    else if (validator.hasOwnProperty("min") || validator.hasOwnProperty("max")) {
                        if (validator.min && value < validator.min) {
                            return; //min defined and value is less than min
                        }
                        if (validator.max && value > validator.max) {
                            return; //max defined and value is greater than max
                        }
                    }
                }
            }
            return value;
        },
        getMapping: function (config, key) {
            if (config._optionsMap) {
                var mapping = config._optionsMap[key];
                if (mapping) {
                    return mapping;
                }
            }
            if (config._parentMapping) {
                return config._parentMapping + "." + key;
            }
            return key;
        }
    });
    namespace("Telerik.UI", {
        Control: Control,
        WidgetWrapper: WidgetWrapper,
        _ControlConfiguration: _ControlConfiguration
    });
    var defineProperty = _ControlConfiguration.defineProperty;
    namespace("Telerik.UI.Common", {
        _BorderConfiguration: derive(_ControlConfiguration, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of a border.
            /// </summary>
}, {
            /// <field type="String">Gets or sets the color of the border.</field>
            color: defineProperty("color", "black"),
            /// <field type="String" defaultValue="solid">
            /// Gets or sets the dash type of the border. Accepted valies are:
            /// "solid", "dot", "dash", "longDash", "dashDot", "longDashDot", "longDashDotDot"
            /// </field>
            /// <options>
            /// <option value="solid">solid</option>
            /// <option value="dot">dot</option>
            /// <option value="dash">dash</option>
            /// <option value="longDash">longDash</option>
            /// <option value="dashDot">dashDot</option>
            /// <option value="longDashDot">longDashDot</option>
            /// <option value="longDashDotDot">longDashDotDot</option>
            /// </options>
            dashType: defineProperty("dashType", "solid"),
            /// <field type="Number">Gets or sets the width of the border in pixels.</field>
            width: defineProperty("width", 0)
        }),
        _BoxConfiguration: derive(_ControlConfiguration, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of a bounding box such as padding or margin.
            /// </summary>
}, {
            /// <field type="Number">Gets or sets the left value.</field>
            left: defineProperty("left", 0),
            /// <field type="Number">Gets or sets the right value.</field>
            right: defineProperty("right", 0),
            /// <field type="Number">Gets or sets the top value.</field>
            top: defineProperty("top", 0),
            /// <field type="Number">Gets or sets the bottom value.</field>
            bottom: defineProperty("bottom", 0)
        })
    });
    //kendo overrides
    var oldRenderSVG = kendo.dataviz.renderSVG;
    kendo.dataviz.renderSVG = function (container, svg) {
        MSApp.execUnsafeLocalFunction(function () {
            oldRenderSVG(container, svg);
        });
    };
    //jQuery animation extends
    extend($.easing, {
        easeInOutSine: function (unused, time, start, end, duration) {
            return -end / 2 * (Math.cos(Math.PI * time / duration) - 1) + start;
        }
    });
})(this, jQuery);/// <reference path="//Microsoft.WinJS.1.0/js/base.js" />
/// <reference path="/jquery/jquery-1.7.2.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
    "use strict";
    var win = WinJS,
        define = win.Class.define,
        derive = win.Class.derive,
        mix = win.Class.mix,
        namespace = win.Namespace.define,
        utilities = win.Utilities,
        telerik = Telerik,
        ui = telerik.UI,
        util = telerik.Utilities,
        common = ui.Common,
        nsName = "Telerik.Data",
        ns = namespace(nsName),
        keys = Object.keys,
        OBJECT = "object",
        NUMBER = "number",
        ARRAY = "array",
        FUNCTION = "function",
        NULL = null,
        CHANGE = "change",
        ERROR = "error";
    function defineProperty(name, defaultValue, getterMapping, setterMapping) {
        return {
            get: function () {
                var ds = this._ds,
                    key = getterMapping || name,
                    value = util.getPropertyValue(ds, key);
                if (value === undefined) {
                    value = defaultValue;
                }
                return value;
            },
            set: function (value) {
                var that = this,
                    key = getterMapping || name,
                    oldValue = that[name],
                    value = ui._ControlConfiguration.validate(that._validators || {}, name, value, that[name]);
                if (value !== undefined) {
                    util.setPropertyValue(that._ds, key, value);
                    if (setterMapping) {
                        util.setPropertyValue(that._ds, setterMapping, value);
                    }
                    that._change(name, value, oldValue);
                }
            },
            enumerable: true
        };
    }
    var DataSource = define(function (options) {
        /// <summary>
        /// Initializes a new instance of the Telerik.Data.DataSource component.
        /// </summary>
        /// <param name="options" type="Object">The configuration options for this DataSource component.</param>
        /// <event name="change">Fires when the underlying data is changed.</event>
        /// <event name="error">Fires when an error occurs during data retrieval.</event>
        /// <event name="requeststart">Fires before a data request is made.</event>
}, {
        /// <field type="Array">
        /// Gets or sets the underlying raw data array.
        /// </field>
        data: {get:function(){}, set:function(value){}},
        /// <field type="Array">
        /// Gets the object that describes the raw data format. Once configured through
        /// the constructor options, the schema is read-only.
        /// </field>
        schema: {get:function(){}},
        /// <field type="Array">
        /// Gets or sets the object that describes how data is loaded from a remote endpoint.
        /// Once configured through the constructor options, the transport is read-only.
        /// </field>
        transport: {get:function(){}},
        /// <field type="Boolean">
        /// Gets or sets the name of a transport with preconfigured settings. Currently only "odata" is supported.
        /// Once configured through the constructor options, the transport type is read-only.
        /// </field>
        /// <options>
        /// <option value=""></option>
        /// <option value="odata">odata</option>
        /// </options>
        type: {get:function(){}},
        /// <field type="Number" integer="true" mayBeNull="true">
        /// Gets or sets the page index. Default value is null.
        /// </field>
        page: defineProperty("page", NULL, "_page"),
        /// <field type="Number" integer="true" mayBeNull="true">
        /// Gets or sets the number of items a page of data contains. Default value is null, indicating no paging is used.
        /// </field>
        pageSize: defineProperty("pageSize", NULL, "_pageSize"),
        /// <field type="Object">
        /// Gets or sets the filter descriptors. Accepts an object or an array of objects for multiple filter descriptors.
        /// </field>
        filter: defineProperty("filter", NULL, "options.filter", "_filter"),
        /// <field type="Object">
        /// Gets or sets the group descriptors. Accepts an object or an array of objects for multiple group descriptors.
        /// </field>
        group: defineProperty("group", NULL, "options.group", "_group"),
        /// <field type="Object">
        /// Gets or sets the sort descriptors. Accepts an object or an array of objects for multiple sort descriptors.
        /// </field>
        sort: defineProperty("sort", NULL, "options.sort", "_sort"),
        /// <field type="Object">
        /// Gets or sets the aggregate descriptors. Accepts an object or an array of objects for multiple aggregate descriptors.
        /// </field>
        aggregate: defineProperty("aggregate", NULL, "options.aggregate", "_aggregate"),
        /// <field type="Boolean">
        /// Gets or sets a value indicating whether aggregates should be calculated on the server when a remote endpoint is used.
        /// </field>
        serverAggregates: defineProperty("serverAggregates", false, "options.serverAggregates"),
        /// <field type="Boolean">
        /// Gets or sets a value indicating whether filtering should be applied on the server when a remote endpoint is used.
        /// </field>
        serverFiltering: defineProperty("serverFiltering", false, "options.serverFiltering"),
        /// <field type="Boolean">
        /// Gets or sets a value indicating whether grouping should be applied on the server when a remote endpoint is used.
        /// </field>
        serverGrouping: defineProperty("serverGrouping", false, "options.serverGrouping"),
        /// <field type="Boolean">
        /// Gets or sets a value indicating whether paging should be applied on the server when a remote endpoint is used.
        /// </field>
        serverPaging: defineProperty("serverPaging", false, "options.serverPaging"),
        /// <field type="Boolean">
        /// Gets or sets a value indicating whether sorting should be applied on the server when a remote endpoint is used.
        /// </field>
        serverSorting: defineProperty("serverSorting", false, "options.serverSorting"),
        /// <field type="Number" integer="true">
        /// Retrieves the number of available pages.
        /// </field>
        totalPages: {get:function(){}},
        /// <field type="Number" integer="true">
        /// Retrieves the total number of data records.
        /// </field>
        total: {get:function(){}},
        /// <field type="Object" readonly="true" hidden="true">
        /// Retrieves the result of aggregation.
        /// </field>
        aggregates: {get:function(){}},
        /// <field type="Array" readonly="true" hidden="true">
        /// Gets a view of the data with operations such as sorting, paging, filtering and grouping applied. To ensure data is
        /// available, this property should be used from within the change event of the data source, or from a success callback
        /// of the promise returned by a data-processing method such as fetch or read.
        /// </field>
        view: {get:function(){}},
        at: function (index) {
            /// <summary>
            /// Returns the data record at the specified index.
            /// </summary>
            /// <param name="index" type="Number" integer="true">The index of the data record to retrieve.</param>
            /// <returns type="Object"></returns>
},
        fetch: function () {
            /// <summary>
            /// Fetches data using the current filter/sort/group/paging information. If data is not available or remote operations 
            /// are enabled, data is requested through the transport, otherwise operations are executed over the available data.
            /// </summary>
            /// <returns type="WinJS.Promise"></returns>
},
        read: function () {
            /// <summary>
            /// Read the data into the DataSource using the transport read definition.
            /// </summary>
            /// <returns type="WinJS.Promise"></returns>
},
        query: function (options) {
            /// <summary>
            /// Executes a query over the data. Available operations are paging, sorting, filtering, grouping. 
            /// If data is not available or remote operations are enabled, data is requested through the transport. 
            /// Otherwise operations are executed over the available data.
            /// </summary>
            /// <param name="options" type="Object">Configuration options for this query. Contains page, sort, filter, group and aggregate descriptors.</param>
            /// <returns type="WinJS.Promise"></returns>
}
    });
    mix(DataSource, common.eventMixin, utilities.createEventProperties("change", "error", "requeststart"));
    namespace(nsName, {
        DataSource: DataSource
    });
})(this, jQuery);/// <reference path="//Microsoft.WinJS.1.0/js/base.js" />
/// <reference path="/jquery/jquery-1.7.2.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
    "use strict";
    var win = WinJS,
        derive = win.Class.derive,
        mix = win.Class.mix,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
        BOOLEAN = "boolean",
        RADIX = 10,
        CONTAINERCSSCLASS = "t-list";
        /// <summary>
        /// Serves as a base class for the AutoComplete, DropDownList and ComboBox controls. For internal use only.
        /// </summary>
        /// <event name="change">Fires when the value of the control changes.</event>
        /// <event name="open">Fires when the drop-down list is shown.</event>
        /// <event name="close">Fires when the drop-down list is closed.</event>
        /// <event name="select">Fires when an item is selected from the drop-down list.</event>
        /// <event name="databinding">Fires when the control is about to databind.</event>
        /// <event name="databound">Fires immediately after the control is databound.</event>
        /// <excludetoc />
    var ListBase = derive(ui.WidgetWrapper, function (element, options) {
        /// <summary>
        /// Serves as a base class for the AutoComplete, DropDownList and ComboBox controls. For internal use only.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
        /// <param name="options" type="Object">The initialization options for this control.</param>
}, {
        //Override this method when the control needs to set additional
        //options after the widget has been initialized. Call this
        //method in derived classes after ensuring widget is initialized.
        /// <field type="String">
        /// Gets or sets the text of the control.
        /// </field>
        text: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the value of the control. When setting the value, if no item with
        /// the specified value exists, the control value will not be set.
        /// </field>
        value: {get:function(){}, set:function(value){}},
        /// <field type="Object">
        /// Gets the animation options to be used for opening/closing the popup.
        /// </field>
        animation: {get:function(){}},
        /// <field type="Boolean" defaultValue="true">
        /// Gets or sets a value indicating whether to bind the widget to the dataSource on initialization.
        /// </field>
        autoBind: {get:function(){}, set:function(value){}},
        /// <field type="Telerik.Data.DataSource">
        /// Gets or sets the data source of the control.
        /// </field>
        dataSource: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the field of the data item that provides the text content of the list items.
        /// </field>
        dataTextField: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the field of the data item that provides the value content of the list items.
        /// </field>
        dataValueField: {get:function(){}, set:function(value){}},
        /// <field type="Number">
        /// Gets or sets the delay in ms after which the control will start filtering the dataSource.
        /// </field>
        delay: {get:function(){}, set:function(value){}},
        /// <field type="Boolean" defaultValue="true">
        /// Gets or sets the enabled state of the control.
        /// </field>
        enabled: {get:function(){}, set:function(value){}},
        /// <field type="Number"  defaultValue="200">
        /// Gets or sets the height of the drop-down list in pixels.
        /// </field>
        height: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the template to be used for rendering the items in the list.
        /// </field>
        template: {get:function(){}, set:function(value){}},
        /// <field type="Boolean" defaultValue="true">
        /// Gets or sets a value indicating whether the search should be case sensitive.
        /// </field>
        ignoreCase: {get:function(){}, set:function(value){}},
        /// <field type="Boolean">
        /// Gets a value indicating whether the list container is currently open.
        /// </field>
        isOpen: {get:function(){}},
        dataItem: function (index) {
            /// <summary>
            /// Returns the raw data record at the specified index.
            /// </summary>
            /// <param name="index" type="Number" integer="true">The zero-based index of the data record to retrieve.</param>
},
        refresh: function () {
            /// <summary>
            /// Re-renders the items in the drop-down list.
            /// </summary>
},
        search: function (word) {
            /// <summary>
            /// Filters the data using the provided parameter and rebinds drop-down list.
            /// </summary>
            /// <param name="word" type="String">The value to search for.</param>
},
        select: function (li) {
            /// <summary>
            /// Selects drop-down list item and sets the text of the combobox control.
            /// </summary>
            /// <param name="li" type="HTMLElement" domElement="true">The list item element to select.</param>
},
        close: function () {
            /// <summary>
            /// Closes the drop-down list.
            /// </summary>
}
    });
    mix(ListBase, win.Utilities.createEventProperties("open", "close", "select", "change", "databinding", "databound"));
    namespace("Telerik.UI", {
        ListBase: ListBase
    });
})(this, jQuery);/// <reference path="//Microsoft.WinJS.1.0/js/base.js" />
/// <reference path="/jquery/jquery-1.7.2.js" />
/// <reference path="/js/core.js" />
(function (global, undefined) {
    "use strict"
    var win = WinJS,
        define = win.Class.define,
        derive = win.Class.derive,
        mix = win.Class.mix,
        namespace = win.Namespace.define,
        utilities = win.Utilities,
        animation = win.UI.Animation,
        telerik = Telerik,
        ui = telerik.UI;
    var NULL = null,
        ZERO = 0,
        ONE = 1,
        ITEMCOUNT = 3,
        ITEMLENGTH = 70,
        ITEMSPACING = 10,
        EMPTYSTRING = "",
        PX = "px",
        TLOOPINGLIST = "t-looping-list",
        TLOOPINGLISTITEM = "t-looping-list-item",
        TSELECTED = "t-selected",
        HIDDEN = "hidden",
        OBJECT = "object",
        TOP = "top",
        TRUE = true,
        FALSE = false,
        EMPTYSTARTINDEX = -1,
        EMPTYBOUNDLENGTH = -1,
        STARTINDEX = 0,
        BOUNDLENGTH = 1;    
    var _Range = define(function (start, end) {
}, {
        end: {get:function(){}, set:function(value){}},
        length: {get:function(){}},
        value: function (index) {
},
        index: function (value) {
}
    });
    var _LoopingRange = derive(_Range, function (options) {
}, {
        range: function () {
},
        up: function () {
},
        down: function () {
},
        centerAt: function (value) {
}
    });
    var _LoopingQueue = define(function (array) {
}, {
        array: {get:function(){}},
        add: function (item) {
},
        shiftLeft: function () {
},
        shiftRight: function () {
}
    });
    var _LoopingList = derive(ui.Control, function (element, options) {
}, {
        /// <field type="HTMLElement" domElement="true" hidden="true">
        /// Gets the DOM element that hosts this control.
        /// </field>
        element: NULL,
        itemCount: {get:function(){}, set:function(value){}},
        itemLength: {get:function(){}, set:function(value){}},
        itemSpacing: {get:function(){}, set:function(value){}},
        value: {get:function(){}, set:function(value){}},
        itemBound: {set:function(value){}},
        bind: function (loopingRange) {
},
        showSelectionItems: function () {
},
        hideSelectionItems: function () {
},
        refresh: function () {
},
        // Gesture handling methods
        });
    var _SlidingList = derive(_LoopingList, function (element, options) {
}, {
        refresh: function () {
},
        bind: function () {
},
        });
    mix(_LoopingList, win.Utilities.eventMixin);
    namespace("Telerik.UI.DateTimePickers", {
        _Range: _Range,
        _LoopingRange: _LoopingRange,
        _LoopingQueue: _LoopingQueue,
        _LoopingList: _LoopingList,
        _SlidingList: _SlidingList
    });
})(this);/// <reference path="//Microsoft.WinJS.1.0/js/base.js" />
/// <reference path="/jquery/jquery-1.7.2.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
    "use strict";
    var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
        util = Telerik.Utilities,
        RADIX = 10;
        /// <summary>
        /// A textbox providing text suggestions.
        /// </summary>
        /// <icon src="autocompletebox_html_12.png" width="12" height="12" />
        /// <icon src="autocompletebox_html_16.png" width="16" height="16" />
        /// <htmlSnippet><![CDATA[<span data-win-control="Telerik.UI.RadAutoCompleteBox"></span>]]></htmlSnippet>
        /// <event name="open">Fires when the drop-down list of RadAutoComplete is shown.</event>
        /// <event name="close">Fires when the drop-down list of RadAutoComplete is closed.</event>
        /// <event name="select">Fires when an item is selected from the drop-down list.</event>
        /// <event name="change">Fires when the value of the RadAutoComplete changes.</event>
        /// <event name="databinding">Fires when the control is about to databind.</event>
        /// <event name="databound">Fires immediately after the control is databound.</event>
        /// <part name="autoCompleteBox" class="k-autocomplete">The RadAutoCompleteBox widget.</part>
        /// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
        /// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
    var RadAutoCompleteBox = derive(ui.ListBase, function (element, options) {
        /// <summary>
        /// Creates a new RadAutoCompleteBox control.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
        /// <param name="options" type="Object">The initialization options for this control.</param>
}, {
        /// <field type="String">
        /// Gets or sets the value of the autocomplete.
        /// </field>
        text: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the type of filtration to use when filtering the data items.
        /// </field>
        filter: {get:function(){}, set:function(value){}},
        /// <field type="Number" integer="true" defaultValue="1">
        /// Gets or sets the minimum amount of characters that should be typed before RadAutoCompleteBox queries the dataSource.
        /// </field>
        minLength: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the string that appears in the textbox when it has no value.
        /// </field>
        placeholder: {get:function(){}, set:function(value){}},
        /// <field type="Boolean">
        /// Gets or sets a value indicating whether RadAutoCompleteBox should automatically auto-type the rest of text.
        /// </field>
        autoSuggest: {get:function(){}, set:function(value){}},
        suggest: function (value) {
        	/// <summary>
            /// Forces a suggestion onto the text of the AutoComplete.
        	/// </summary>
            /// <param name="value" type="String">Characters to force a suggestion.</param>
},
        /// <field type="Boolean">
        /// Gets or sets a value indicating whether RadAutoCompleteBox should automatically highlight the first shown item.
        /// </field>
        highlightFirst: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the separator for completion. Empty by default, allowing for only one completion.
        /// </field>
        separator: {get:function(){}, set:function(value){}}
        });
    namespace("Telerik.UI", {
        RadAutoCompleteBox: RadAutoCompleteBox
    });
})(this, jQuery);/// <reference path="//Microsoft.WinJS.1.0/js/base.js" />
/// <reference path="/jquery/jquery-1.7.2.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
    "use strict";
    var win = WinJS,
        derive = win.Class.derive,
        mix = win.Class.mix,
        namespace = win.Namespace.define,
        utilities = win.Utilities,
        telerik = Telerik,
        ui = telerik.UI,
        nsName = "Telerik.UI.Chart",
        ns = namespace(nsName),
        common = ui.Common,
        util = telerik.Utilities,
        extend = $.extend,
        keys = Object.keys,
        OBJECT = "object",
        ARRAY = "array",
        NULL = null,
        SANS12 = "12px Arial,Helvetica,sans-serif",
        config = ui._ControlConfiguration,
        defineProperty = config.defineProperty,
        getMapping = config.getMapping,
        priv = util.setPrivate;
    namespace(nsName, {
        _TitleConfiguration: derive(config, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of a chart title.
            /// </summary>
}, {
            /// <field type="String" defaultValue="center">
            /// Gets or sets the chart title alignment. Accepted values are: "left", "center", "right". Default is "center"
            /// </field>
            /// <options>
            /// <option value="left">left</option>
            /// <option value="center">center</option>
            /// <option value="right">right</option>
            /// </options>
            align: defineProperty("align", "center"),
            /// <field type="String">
            /// Gets or sets the background color of the chart title.
            /// </field>
            background: defineProperty("background", ""),
            /// <field type="Telerik.UI.Common._BorderConfiguration">
            /// Gets the border settings of the chart title.
            /// </field>
            border: {get:function(){}},
            /// <field type="String">
            /// Gets or sets the text color of the chart title.
            /// </field>
            color: defineProperty("color", ""),
            /// <field type="String">
            /// Gets or sets the title font.
            /// </field>
            font: defineProperty("font", SANS12),
            /// <field type="Telerik.UI.Common._BoxConfiguration">
            /// Gets the margin settings of the chart title.
            /// </field>
            margin: {get:function(){}},
            /// <field type="Telerik.UI.Common._BoxConfiguration">
            /// Gets the padding settings of the chart title.
            /// </field>
            padding: {get:function(){}},
            /// <field type="String" defaultValue="top">
            /// Gets or sets the vertical position of the chart title. Accepted values are: "top" and "bottom". Default is "top".
            /// </field>
            /// <options>
            /// <option value="top">top</option>
            /// <option value="bottom">bottom</option>
            /// </options>
            position: defineProperty("position", "top"),
            /// <field type="String">
            /// Gets or sets the title text.
            /// </field>
            text: defineProperty("text", ""),
            /// <field type="Boolean">
            /// Gets or sets the title visibility. Default is false.
            /// </field>
            visible: defineProperty("visible", false)
        })
    });
    namespace(nsName, {
        _LegendLabelConfiguration: derive(config, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of chart legend labels.
            /// </summary>
}, {
            /// <field type="String">
            /// Gets or sets the text color of the label. Any valid CSS color value is accepted.
            /// </field>
            color: defineProperty("color", "black"),
            /// <field type="String">
            /// Gets or sets the label font style.
            /// </field>
            font: defineProperty("font", SANS12)
        })
    });
    namespace(nsName, {
        _LegendConfiguration: derive(config, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of a chart legend.
            /// </summary>
}, {
            /// <field type="String">
            /// Gets or sets the background color of chart legend. Any valid CSS value is accepted.
            /// </field>
            background: defineProperty("background", "white"),
            /// <field type="Telerik.UI.Common._BorderConfiguration">
            /// Gets the border settings of the chart legend.
            /// </field>
            border: {get:function(){}},
            /// <field type="Telerik.UI.Chart._LegendLabelConfiguration">
            /// Gets the label settings of the chart legend.
            /// </field>
            labels: {get:function(){}},
            /// <field type="Telerik.UI.Common._BoxConfiguration">
            /// Gets the margin settings of the chart legend.
            /// </field>
            margin: {get:function(){}},
            /// <field type="Telerik.UI.Common._BoxConfiguration">
            /// Gets the padding settings of the chart legend.
            /// </field>
            padding: {get:function(){}},
            /// <field type="Number">
            /// Gets or sets the X offset of the legend from its positions.
            /// </field>
            offsetX: defineProperty("offsetX", 0),
            /// <field type="Number">
            /// Gets or sets the Y offset of the legend from its positions.
            /// </field>
            offsetY: defineProperty("offsetY", 0),
            /// <field type="String" defaultValue="right">
            /// Gets or sets the position of the chart legend. Accepted values are:
            /// "top", "bottom", "left", "right", "custom". When a value of "custom"
            /// is used, the legend is positioned using its offsetX and offsetY
            /// properties. Default value is "right".
            /// </field>
            /// <options>
            /// <option value="top">top</option>
            /// <option value="bottom">bottom</option>
            /// <option value="left">left</option>
            /// <option value="right">right</option>
            /// <option value="custom">custom</option>
            /// </options>
            position: defineProperty("position", "right"),
            /// <field type="Boolean" defautlValue="true">
            /// Gets or sets the legend visibility. Default is true.
            /// </field>
            visible: defineProperty("visible", true)
        })
    });
    namespace(nsName, {
        _TooltipConfiguration: derive(config, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of a chart tooltip.
            /// </summary>
}, {
            /// <field type="String">
            /// Gets or sets the background color of the tooltip. The default value is
            /// determined from the series color.
            /// </field>
            background: defineProperty("background", ""),
            /// <field type="Telerik.UI.Common._BorderConfiguration">
            /// Gets the tooltip border settings.
            /// </field>
            border: {get:function(){}},
            /// <field type="String">
            /// Gets or sets the text color of the tooltip. The default value is
            /// determined from the series label color.
            /// </field>
            color: defineProperty("color", ""),
            /// <field type="String">
            /// Gets or sets the tooltip font.
            /// </field>
            font: defineProperty("font", SANS12),
            /// <field type="String">
            /// Gets or sets the tooltip format.
            /// </field>
            format: defineProperty("format", ""),
            /// <field type="Telerik.UI.Common._BoxConfiguration">
            /// Gets the padding settings of the tooltip.
            /// </field>
            padding: {get:function(){}},
            /// <field type="String">
            /// Gets or sets the templated that is used to render the tooltip. Available
            /// template variables are value, category, series and dataItem.
            /// </field>
            template: defineProperty("template", ""),
            /// <field type="Boolean">
            /// Gets or sets the tooltip visibility. Default is false.
            /// </field>
            visible: defineProperty("visible", false)
        })
    });
    namespace(nsName, {
        _PlotAreaConfiguration: derive(config, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of the chart plot area.
            /// </summary>
}, {
            /// <field type="String">
            /// Gets or sets the background color of the plot area.
            /// </field>
            background: defineProperty("background", "white"),
            /// <field type="Telerik.UI.Common._BorderConfiguration">
            /// Gets the border settings of the plot area.
            /// </field>
            border: {get:function(){}},
            /// <field type="Telerik.UI.Common._BoxConfiguration">
            /// Gets the margin settings of the plot area.
            /// </field>
            margin: {get:function(){}}
        })
    });
    namespace(nsName, {
        _LabelConfiguration: derive(config, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of chart labels.
            /// </summary>
}, {
            /// <field type="String">
            /// Gets or sets the background color of the labels. Any valid CSS color is accepted.
            /// </field>
            background: defineProperty("background", ""),
            /// <field type="Telerik.UI.Common._BorderConfiguration">
            /// Gets the border settings of the labels.
            /// </field>
            border: {get:function(){}},
            /// <field type="String">
            /// Gets or sets the text color of the labels. Any valid CSS color is accepted.
            /// </field>
            color: defineProperty("color", ""),
            /// <field type="String">
            /// Gets or sets the font style of the labels.
            /// </field>
            font: defineProperty("font", ""),
            /// <field type="String">
            /// Gets or sets the format of the labels.
            /// </field>
            format: defineProperty("format", ""),
            /// <field type="Telerik.UI.Common._BoxConfiguration">
            /// Gets the margin settings of the labels.
            /// </field>
            margin: {get:function(){}},
            /// <field type="Telerik.UI.Common._BoxConfiguration">
            /// Gets the padding settings of the labels.
            /// </field>
            padding: {get:function(){}},
            /// <field type="String">
            /// Gets or sets the label template. Inside the template, the 'value' variable exposes the label value.
            /// </field>
            template: defineProperty("template", ""),
            /// <field type="Boolean">
            /// Gets or sets the visibility of the labels.
            /// </field>
            visible: defineProperty("visible", false)
        })
    });
    namespace(nsName, {
        /// <ancestor type="Telerik.UI._ControlConfiguration" />
        _AxisTitleConfiguration: derive(ns._TitleConfiguration, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of a chart axis title.
            /// </summary>
}, {
            /// <field type="Number">
            /// Gets or sets the rotation angle of the axis title.
            /// </field>
            rotation: defineProperty("rotation", 0)
        })
    });
    namespace(nsName, {
        _AxisLabelDateFormatConfiguration: derive(ui._ControlConfiguration, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of the date label format on a chart axis.
            /// </summary>
}, {
            /// <field type="String">
            /// Gets or sets the format for displaying hour values in the axis labels. Default value is "HH:mm".
            /// </field>
            hours: defineProperty("hours", "HH:mm"),
            /// <field type="String">
            /// Gets or sets the format for displaying day values in the axis labels. Default value is "M/d".
            /// </field>
            days: defineProperty("days", "M/d"),
            /// <field type="String">
            /// Gets or sets the format for displaying month values in the axis labels. Default value is "MMM 'yy".
            /// </field>
            months: defineProperty("months", "MMM 'yy"),
            /// <field type="String">
            /// Gets or sets the format for displaying year values in the axis labels. Default value is "yyyy".
            /// </field>
            years: defineProperty("years", "yyyy"),
        })
    });
    namespace(nsName, {
        /// <ancestor type="Telerik.UI._ControlConfiguration" />
        _AxisLabelConfiguration: derive(ns._LabelConfiguration, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of the chart axis labels.
            /// </summary>
}, {
            /// <field type="Boolean">
            /// Gets or sets a value indicating whether the labels and ticks are mirrored. Mirrored labels
            /// usually rendered on the left side will be rendered on the right.
            /// </field>
            mirror: defineProperty("mirror", false),
            /// <field type="Number">
            /// Gets or sets the rotation angle of the labels.
            /// </field>
            rotation: defineProperty("rotation", 0),
            /// <field type="Number">
            /// Gets or sets the number of labels from the beginning of the axis to skip rendering.
            /// </field>
            skip: defineProperty("skip", 0),
            /// <field type="Number">
            /// Gets or sets the label rendering step. Every n-th label is rendered, where n is the step value.
            /// </field>
            step: defineProperty("step", 1),
            /// <field type="Telerik.UI.Chart._AxisLabelDateFormatConfiguration">
            /// Gets the date formatting settings for the axis labels when the axis values are of Date type.
            /// </field>
            dateFormats: {get:function(){}}
        })
    });
    namespace(nsName, {
        _AxisLineConfiguration: derive(config, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of a chart axis line.
            /// </summary>
}, {
            /// <field type="String">
            /// Gets or sets the color of the axis line. Any valid CSS color is accepted.
            /// </field>
            color: defineProperty("color", "black"),
            /// <field type="Boolean">
            /// Gets or sets the visibility of the axis line.
            /// </field>
            visible: defineProperty("visible", true),
            /// <field type="Number" defaultValue="1">
            /// Gets or sets the width of the axis line in pixels.
            /// </field>
            width: defineProperty("width", 1)
        })
    });
    namespace(nsName, {
        _AxisTickConfiguration: derive(config, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of a chart axis tick.
            /// </summary>
}, {
            /// <field type="Number">
            /// Gets or sets the width of the axis tick lines in pixels.
            /// </field>
            size: defineProperty("size", 0),
            /// <field type="Boolean">
            /// Gets or sets the visibility of the axis tick lines.
            /// </field>
            visible: defineProperty("visible", false)
        })
    });
    namespace(nsName, {
        _AxisConfiguration: derive(config, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of a chart axis.
            /// </summary>
}, {
            /// <field type="Number">
            /// Gets or sets the value at which this axis crosses the perpendicular axis.
            /// </field>
            axisCrossingValue: defineProperty("axisCrossingValue", 0),
            /// <field type="String">
            /// Gets or sets the color to all apply to all axis elements. Individual color settings
            /// for line and labels take priority. Any valid CSS color is accepted.
            /// </field>
            color: defineProperty("color", ""),
            /// <field type="Telerik.UI.Chart._AxisLabelConfiguration">
            /// Gets the axis label settings.
            /// </field>
            labels: {get:function(){}},
            /// <field type="Telerik.UI.Chart._AxisLineConfiguration">
            /// Gets the axis line settings.
            /// </field>
            line: {get:function(){}},
            /// <field type="Telerik.UI.Chart._AxisLineConfiguration">
            /// Gets the major grid line settings.
            /// </field>
            majorGridLines: {get:function(){}},
            /// <field type="Telerik.UI.Chart._AxisLineConfiguration">
            /// Gets the minor grid line settings.
            /// </field>
            minorGridLines: {get:function(){}},
            /// <field type="Telerik.UI.Chart._AxisTickConfiguration">
            /// Gets the major tick settings
            /// </field>
            majorTicks: {get:function(){}},
            /// <field type="Telerik.UI.Chart._AxisTickConfiguration">
            /// Gets the minor tick settings
            /// </field>
            minorTicks: {get:function(){}},
            /// <field type="Number">
            /// Gets or sets the minimum value of the axis. This property is often used in combination
            /// with the max property to adjust the size of the chart relative to the charting area.
            /// </field>
            min: defineProperty("min", 0),
            /// <field type="Number">
            /// Gets or sets the maximum value of the axis. This property is often used in combination
            /// with the min property to adjust the size of the chart relative to the charting area.
            /// </field>
            max: defineProperty("max", 1),
            /// <field type="Number">
            /// Gets or sets the interval between major divisions. For example, on a column chart, this property
            /// determines the step size whole going up the vertical axis. You can additionally have minor steps
            /// and ticks in between the major ones by adjusting the minorUnit and minorTick.size properties.
            /// </field>
            majorUnit: defineProperty("majorUnit", 0),
            /// <field type="Number">
            /// Gets or sets the interval between minor divisions. For more information, refer to the
            /// majorUnit property description.
            /// </field>
            minorUnit: defineProperty("minorUnit", 0),
            /// <field type="String">
            /// Gets or sets the unique axis name.
            /// </field>
            name: defineProperty("name", ""),
            /// <field type="Array" elementType="{ from:0, to: 100, color: 'navy' }">
            /// Gets or sets the plot bands of the axis. Elements of this array must be
            /// objects of the form { from:0, to: 100, color: 'navy' }
            /// </field>
            plotBands: defineProperty("plotBands", []),
            /// <field type="Boolean" defaultValue="false">
            /// Gets or sets a value indicating whether the axis direction is reversed.
            /// </field>
            reverse: defineProperty("reverse", false),
            /// <field type="Telerik.UI.Chart._AxisTitleConfiguration">
            /// Retrieves the chart axis title settings.
            /// </field>
            title: {get:function(){}},
            /// <field type="Boolean" defaultValue="true">
            /// Gets or sets the visibility of this axis.
            /// </field>
            visible: defineProperty("visible", true),
            /// <field type="String">
            /// Gets or sets the base time interval for the axis when axis values are of Date type. Accepted values are
            /// "minutes", "hours", "days", "months" and "years". The default value is determined automatically from the
            /// minimum difference between subsequent categories.
            /// </field>
            /// <options>
            /// <option value="minutes">minutes</option>
            /// <option value="hours">hours</option>
            /// <option value="days">days</option>
            /// <option value="months">months</option>
            /// <option value="years">years</option>
            /// </options>
            baseUnit: defineProperty("baseUnit", NULL)
        })
    });
    namespace(nsName, {
        /// <ancestor type="Telerik.UI._ControlConfiguration" />
        _CategoryAxisConfiguration: derive(ns._AxisConfiguration, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of the chart category axis.
            /// </summary>
}, {
            /// <field type="Array">
            /// Gets or sets the array of category names that will be used to label the categories in the chart.
            /// </field>
            categories: defineProperty("categories", []),
            /// <field type="String">
            /// Gets or sets the field from the objects in the categories array that will be used to retrieve
            /// the category name. Use this property when the categories array contains objects instead
            /// of primitive types.
            /// </field>
            field: defineProperty("field", "")
        })
    });
    namespace(nsName, {
        Series: derive(config, function () {
            /// <summary>
            /// Base class for all chart series.
            /// </summary>
}, {
            //holds the series options corresponding to this series copied from the widget
            //copy widget options to inner configuration objects
            /// <field type="String" hidden="true">
            /// Gets the type of this series.
            /// </field>
            type: { value: "" },
            /// <field type="String">
            /// Gets or sets the color with which this series is displayed on the plot area.
            /// </field>
            color: defineProperty("color", ""),
            /// <field type="Telerik.UI.Common._BorderConfiguration">
            /// Gets the border settings for this series.
            /// </field>
            border: {get:function(){}},
            /// <field type="Telerik.UI.Chart._LabelConfiguration">
            /// Gets or sets the settings for the series data labels.
            /// </field>
            labels: {get:function(){}},
            /// <field type="Boolean">
            /// Indicates whether the series should be stacked.
            /// </field>
            stack: defineProperty("stack", false),
            /// <field type="Telerik.UI.Chart._TooltipConfiguration">
            /// Retrieves the tooltip settings for this series.
            /// </field>
            tooltip: {get:function(){}},
            /// <field type="Array">
            /// Gets or sets the array of data points for this series.
            /// </field>
            data: defineProperty("data", []),
            /// <field type="String">
            /// Gets or sets the data field containing the series value.
            /// </field>
            field: defineProperty("field", ""),
            /// <field type="String">
            /// Gets or sets the name template for auto-generated series when binding to grouped data.
            /// Template variables: series, group, group.field, group.value.
            /// </field>
            groupNameTemplate: defineProperty("groupNameTemplate", ""),
            /// <field type="String">
            /// Gets or sets the series name visible in the legend.
            /// </field>
            name: defineProperty("name", ""),
            /// <field type="Boolean" defaultValue="true">
            /// Indicates whether to show the series in the legend.
            /// </field>
            visibleInLegend: defineProperty("visibleInLegend", true),
            /// <field type="Number" defaultValue="1">
            /// Gets or sets series opacity.
            /// </field>
            opacity: defineProperty("opacity", 1)
        })
    });
    namespace(nsName, {
        _SeriesMarkersConfiguration: derive(config, function (seriesOption) {
            /// <summary>
            /// For internal usage only. Describes the properties of the markers of a chart series.
            /// </summary>
}, {
            //holds the series options corresponding to this series copied from the widget
            /// <field type="String">
            /// Gets or sets the background color of the markers.
            /// </field>
            background: defineProperty("background", ""),
            /// <field type="Telerik.UI.Common._BorderConfiguration">
            /// Gets the border settings for the markers.
            /// </field>
            border: {get:function(){}},
            /// <field type="Number" defaultValue="6">
            /// Gets or sets the size of the markers.
            /// </field>
            size: defineProperty("size", 6),
            /// <field type="String" defaultValue="circle">
            /// Gets or sets the shape type of the markers. Accepted values are: "circle", "square" and "triangle". Default is "circle".
            /// </field>
            /// <options>
            /// <option value="circle">circle</option>
            /// <option value="square">square</option>
            /// <option value="triangle">triangle</option>
            /// </options>
            type: defineProperty("type", "circle"),
            /// <field type="Boolean" defaultValue="true">
            /// Gets or sets the visibility of the markers.
            /// </field>
            visible: defineProperty("visible", true)
        })
    });
    namespace(nsName, {
        _SeriesNegativeValuesConfiguration: derive(config, function (seriesOption) {
            /// <summary>
            /// For internal usage only. Describes the properties of the negative values for a chart series.
            /// </summary>
}, {
            //holds the series options corresponding to this series copied from the widget
            /// <field type="String">
            /// Gets or sets the color of the negative values.
            /// </field>
            color: defineProperty("color", "#ffffff"),
            /// <field type="Boolean">
            /// Gets or sets the visibility of the negative values.
            /// </field>
            visible: defineProperty("visible", false)
        })
    });
    namespace(nsName, {
        _AreaSeriesLineConfiguration: derive(config, function (seriesOption) {
            /// <summary>
            /// For internal usage only. Describes the properties of the lines of an area series in a chart.
            /// </summary>
}, {
            //holds the series options corresponding to this series copied from the widget
            /// <field type="String">
            /// Gets or sets the color of the area series line.
            /// </field>
            color: defineProperty("color", ""),
            /// <field type="Number" defaultValue="1">
            /// Gets or sets the opacity of the area series line.
            /// </field>
            opacity: defineProperty("opacity", 1),
            /// <field type="Number" defaultValue="4">
            /// Gets or sets the line width of the area series.
            /// </field>
            width: defineProperty("width", 4)
        })
    });
    namespace(nsName, {
        AreaSeries: derive(ns.Series, function () {
        /// <summary>
        /// Creates an instance of an area series for RadChart
        /// </summary>
}, {
            //copy widget options to inner configuration objects
            /// <field type="String" readonly="true">
            /// Gets the type of the series.
            /// </field>
            type: { value: "area" },
            /// <field type="Telerik.UI.Chart._AreaSeriesLineConfiguration">
            /// Gets the line settings for the area series.
            /// </field>
            line: {get:function(){}},
            /// <field type="Telerik.UI.Chart._SeriesMarkersConfiguration">
            /// Gets the marker settings for the area series.
            /// </field>
            markers: {get:function(){}},
            /// <field type="String" defaultValue="gap">
            /// Gets or sets the behavior for handling missing values in area series. Accepted values are:
            /// "gap" - the line stops before missing point and continues after it; "interpolate" - the value
            /// is interpolated from neighboring points; "zero" - the value is assumed to be zero. Default is "gap".
            /// </field>
            /// <options>
            /// <option value="gap">gap</option>
            /// <option value="interpolate">interpolate</option>
            /// <option value="zero">zero</option>
            /// </options>
            missingValues: defineProperty("missingValues", "gap"),
            /// <field type="Number" defaultValue="0.4">
            /// Gets or sets the opacity of the area series.
            /// </field>
            opacity: defineProperty("opacity", 0.4)
        })
    });
    namespace(nsName, {
        BarSeries: derive(ns.Series, function () {
        /// <summary>
        /// Creates an instance of a bar series for RadChart
        /// </summary>
}, {
            /// <field type="String" readonly="true">
            /// Gets the type of the series.
            /// </field>
            type: { value: "bar" },
            /// <field type="String">
            /// Gets or sets the name of the value axis to use. Defaults to the primary axis.
            /// </field>
            axis: defineProperty("axis", ""),
            /// <field type="Number" defaultValue="1.5">
            /// Gets or sets the distance between category clusters.
            /// </field>
            gap: defineProperty("gap", 1.5),
            /// <field type="Number" defaultValue="0.4">
            /// Gets or sets the space between bars.
            /// </field>
            spacing: defineProperty("spacing", 0.4),
            /// <field type="String" defaultValue="none">
            /// Gets or sets the overlay gradient used for this series. Allowed values are "none", "glass", "roundedBevel". Default value is "none".
            /// </field>
            /// <options>
            /// <option value="none">none</option>
            /// <option value="glass">glass</option>
            /// <option value="roundedBevel">roundedBevel</option>
            /// </options>
            overlayGradient: defineProperty("overlayGradient", "none")
        })
    });
    namespace(nsName, {
        ColumnSeries: derive(ns.BarSeries, function () {
        /// <summary>
        /// Creates an instance of a column series for RadChart
        /// </summary>
}, {
            /// <field type="String" readonly="true">
            /// Gets the type of the series.
            /// </field>
            type: { value: "column" }
        })
    });
    namespace(nsName, {
        LineSeries: derive(ns.Series, function () {
        /// <summary>
        /// Creates an instance of a line series for RadChart
        /// </summary>
}, {
            /// <field type="String" readonly="true">
            /// Gets the type of the series.
            /// </field>
            type: { value: "line" },
            /// <field type="String">
            /// Gets or sets the name of the value axis to use. Defaults to the primary axis.
            /// </field>
            axis: defineProperty("axis", ""),
            /// <field type="String">
            /// Gets or sets the dash type of the line.
            /// </field>
            /// <options>
            /// <option value="solid">solid</option>
            /// <option value="dot">dot</option>
            /// <option value="dash">dash</option>
            /// <option value="longDash">longDash</option>
            /// <option value="dashDot">dashDot</option>
            /// <option value="longDashDot">longDashDot</option>
            /// <option value="longDashDotDot">longDashDotDot</option>
            /// </options>
            dashType: defineProperty("dashType", ""),
            /// <field type="Telerik.UI.Chart._SeriesMarkersConfiguration">
            /// Gets the marker settings for the line series.
            /// </field>
            markers: {get:function(){}},
            /// <field type="String" defaultValue="gap">
            /// Gets or sets the behavior for handling missing values in line series. Accepted values are:
            /// "gap" - the line stops before missing point and continues after it; "interpolate" - the value
            /// is interpolated from neighboring points; "zero" - the value is assumed to be zero. Default is "gap".
            /// </field>
            /// <options>
            /// <option value="gap">gap</option>
            /// <option value="interpolate">interpolate</option>
            /// <option value="zero">zero</option>
            /// </options>
            missingValues: defineProperty("missingValues", "gap"),
            /// <field type="Number" defaultValue="4">
            /// Gets or sets the line width for this series.
            /// </field>
            width: defineProperty("width", 4)
        })
    });
    namespace(nsName, {
        /// <ancestor type="Telerik.UI._ControlConfiguration" />
        _PieLabelConnectorConfiguration: derive(config, function (seriesOption) {
            /// <summary>
            /// For internal usage only. Describes the properties of the pie series label connectors in a chart.
            /// </summary>
}, {
            //holds the series options corresponding to this series copied from the widget
            /// <field type="String">
            /// Gets or sets teh color of the connector line.
            /// </field>
            color: defineProperty("color", ""),
            /// <field type="Number" defaultValue="4">
            /// Gets or sets the padding between the connector line and the label, and connector line and the pie chart.
            /// </field>
            padding: defineProperty("padding", 4),
            /// <field type="Number" defaultValue="1">
            /// Gets or sets the width of the connector line.
            /// </field>
            width: defineProperty("width", 1)
        })
    });
    namespace(nsName, {
        /// <ancestor type="Telerik.UI._ControlConfiguration" />
        _PieLabelConfiguration: derive(ns._LabelConfiguration, function (seriesOption) {
            /// <summary>
            /// For internal usage only. Describes the properties of the pie series labels in a chart.
            /// </summary>
}, {
            //holds the series options corresponding to this series copied from the widget
            /// <field type="String" defaultValue="circle">
            /// Defines the alignment of the pie labels. Accepted values are "circle" - the labels are positioned
            /// in a circle around the pie chart; "column" - the labels are positioned in columns to the left and
            /// right of the pie chart.
            /// </field>
            /// <options>
            /// <option value="circle">circle</option>
            /// <option value="column">column</option>
            /// </options>
            align: defineProperty("align", "circle"),
            /// <field type="Number" defaultValue="35">
            /// Gets or sets the distance of the labels from the pie arcs.
            /// </field>
            distance: defineProperty("distance", 35),
            /// <field type="String" defaultValue="outsideEnd">
            /// Defines the position of the pie labels. Accepted values are: "outsideEnd" - labels are positioned outside,
            /// near the end of the pie segments; "insideEnd" - labels are positioned inside, near the end of the pie segments;
            /// "center" - labels are positioned at the center of the pie segments. Default value is "outsideEnd".
            /// </field>
            /// <options>
            /// <option value="outsideEnd">outsideEnd</option>
            /// <option value="insideEnd">insideEnd</option>
            /// <option value="center">center</option>
            /// </options>
            position: defineProperty("position", "outsideEnd")
        })
    });
    namespace(nsName, {
        PieSeries: derive(ns.Series, function () {
        /// <summary>
        /// Creates an instance of a pie series for RadChart
        /// </summary>
}, {
            //copy widget options to inner configuration objects
            /// <field type="String" readonly="true">
            /// Gets the type of the series.
            /// </field>
            type: { value: "pie" },
            /// <field type="String">
            /// Gets or sets the data field containing the sector category name.
            /// </field>
            categoryField: defineProperty("categoryField", ""),
            /// <field type="String">
            /// Gets or sets the data field containing the sector color.
            /// </field>
            colorField: defineProperty("colorField", ""),
            /// <field type="String">
            /// Gets or sets the data field containing the boolean value that indicates if the sector is exploded.
            /// </field>
            explodeField: defineProperty("explodeField", ""),
            /// <field type="Telerik.UI.Chart._PieLabelConnectorConfiguration">
            /// Gets the settings for the label connector lines.
            /// </field>
            connectors: {get:function(){}},
            /// <field type="Telerik.UI.Chart._PieLabelConfiguration">
            /// Gets or sets the settings for the series data labels.
            /// </field>
            labels: {get:function(){}},
            /// <field type="Number" defaultValue="0">
            /// Gets the padding value around the pie chart (equal on all sides).
            /// </field>
            padding: defineProperty("padding", 0),
            /// <field type="Number" defaultValue="90">
            /// Gets or sets the start angle of the first pie segment. Default is 90 degrees.
            /// </field>
            startAngle: defineProperty("startAngle", 90),
            /// <field type="String" defaultValue="roundedBevel">
            /// Gets or sets the overlay gradient used for this series. Accepted values are "roundedBevel", "glass" and "none".
            /// </field>
            /// <options>
            /// <option value="none">none</option>
            /// <option value="glass">glass</option>
            /// <option value="roundedBevel">roundedBevel</option>
            /// </options>
            overlayGradient: defineProperty("overlayGradient", "roundedBevel")
        })
    });
    namespace(nsName, {
        DonutSeries: derive(ns.PieSeries, function () {
        /// <summary>
        /// Creates an instance of a donut series for RadChart
        /// </summary>
}, {
            /// <field type="String" readonly="true">
            /// Gets the type of the series.
            /// </field>
            type: { value: "donut" },
			/// <field type="String">
			/// The data field containing the sector category name.
			/// </field>
			categoryField: defineProperty("categoryField", ""),
			/// <field type="String">
			/// The data field containing the sector  color.
			/// </field>
			colorField: defineProperty("colorField", ""),
			/// <field type="Number">
			/// The the radius of the donut hole. If the value is not set, it will be automatically calculated based on the chart size.
			/// </field>
			holeSize: defineProperty("holeSize", 0),
			/// <field type="Number">
			/// The margin around each series (not available for the last level of the series).
			/// </field>
			margin: defineProperty("margin", 1),
			/// <field type="Number">
			/// The width of the donut ring. If the value is not set, it will be automatically calculated based on the chart size.
			/// </field>
			size: defineProperty("size", 0)
        })
    });
    namespace(nsName, {
        ScatterSeries: derive(ns.Series, function () {
        /// <summary>
        /// Creates an instance of a scatter series for RadChart
        /// </summary>
}, {
            //copy widget options to inner configuration objects
            /// <field type="String" readonly="true">
            /// Gets the type of the series.
            /// </field>
            type: { value: "scatter" },
            /// <field type="Telerik.UI.Chart._SeriesMarkersConfiguration">
            /// Gets the marker settings for the scatter series.
            /// </field>
            markers: {get:function(){}},
            /// <field type="String">
            /// The data field containing the scatter x value.
            /// </field>
            xField: defineProperty("xField", ""),
            /// <field type="String">
            /// The data field containing the scatter y value.
            /// </field>
            yField: defineProperty("yField", ""),
            /// <field type="String">
            /// Gets or sets name of the X axis to use. If not specified, defaults to the primary axis.
            /// </field>
            xAxis: defineProperty("xAxis", ""),
            /// <field type="String">
            /// Gets or sets name of the Y axis to use. If not specified, defaults to the primary axis.
            /// </field>
            yAxis: defineProperty("yAxis", "")
        })
    });
    namespace(nsName, {
        BubbleSeries: derive(ns.ScatterSeries, function () {
        /// <summary>
        /// Creates an instance of a bubble series for RadChart
        /// </summary>
}, {
            /// <field type="String" readonly="true">
            /// Gets the type of the series.
            /// </field>
            type: { value: "bubble" },
			/// <field type="String">
			/// The data field containing the bubble category name.
			/// </field>
			categoryField: defineProperty("categoryField", ""),
			/// <field type="String">
			/// The data field containing the bubble color.
			/// </field>
			colorField: defineProperty("colorField", ""),
			/// <field type="Number">
			/// The max size of the bubble.
			/// </field>
			maxSize: defineProperty("maxSize", 100),
			/// <field type="Number">
			/// The min size of the bubble.
			/// </field>
			minSize: defineProperty("minSize", 5),
			/// <field type="Telerik.UI.Chart._SeriesNegativeValuesConfiguration">
            /// The settings for negative values.
            /// </field>
            negativeValues: {get:function(){}},
			/// <field type="String">
			/// The data field containing the bubble size value.
			/// </field>
			sizeField: defineProperty("sizeField", ""),
			/// <field type="String">
			/// The data field containing the bubble x value.
			/// </field>
			xField: defineProperty("xField", ""),
			/// <field type="String">
			/// The data field containing the bubble y value.
			/// </field>
			yField: defineProperty("yField", "")
        })
    });
    namespace(nsName, {
        ScatterLineSeries: derive(ns.ScatterSeries, function () {
        /// <summary>
        /// Creates an instance of a scatter line series for RadChart
        /// </summary>
}, {
            /// <field type="String" readonly="true">
            /// Gets the type of the series.
            /// </field>
            type: { value: "scatterLine" },
            /// <field type="String">
            /// Gets or sets the dash type of the line.
            /// </field>
            /// <options>
            /// <option value="solid">solid</option>
            /// <option value="dot">dot</option>
            /// <option value="dash">dash</option>
            /// <option value="longDash">longDash</option>
            /// <option value="dashDot">dashDot</option>
            /// <option value="longDashDot">longDashDot</option>
            /// <option value="longDashDotDot">longDashDotDot</option>
            /// </options>
            dashType: defineProperty("dashType", ""),
            /// <field type="String" defaultValue="gap">
            /// Gets or sets the behavior for handling missing values in scatter line series. Accepted values are:
            /// "gap" - the line stops before missing point and continues after it; "interpolate" - the value
            /// is interpolated from neighboring points; "zero" - the value is assumed to be zero. Default is "gap".
            /// </field>
            /// <options>
            /// <option value="gap">gap</option>
            /// <option value="interpolate">interpolate</option>
            /// <option value="zero">zero</option>
            /// </options>
            missingValues: defineProperty("missingValues", "gap"),
            /// <field type="Number" defaultValue="1">
            /// Gets or sets the line width for this series.
            /// </field>
            width: defineProperty("width", 1)
        })
    });
    namespace(nsName, {
        VerticalAreaSeries: derive(ns.AreaSeries, function () {
        /// <summary>
        /// Creates an instance of a vertical area series for RadChart
        /// </summary>
}, {
            /// <field type="String" readonly="true">
            /// Gets the type of the series.
            /// </field>
            type: { value: "verticalArea" }
        })
    });
    namespace(nsName, {
        VerticalLineSeries: derive(ns.LineSeries, function () {
        /// <summary>
        /// Creates an instance of a vertical line series for RadChart
        /// </summary>
}, {
            /// <field type="String" readonly="true">
            /// Gets the type of the series.
            /// </field>
            type: { value: "verticalLine" }
        })
    });
        /// <summary>
        /// A charting control that can visualize different chart types.
        /// </summary>
        /// <icon src="chart_html_12.png" width="12" height="12" />
        /// <icon src="chart_html_16.png" width="16" height="16" />
        /// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadChart"></div>]]></htmlSnippet>
        /// <event name="databound">Fires immediately after the control is databound.</event>
        /// <event name="seriesclick">Fires when any of the chart series is clicked.</event>
        /// <event name="serieshover">Fires when any of the chart series is hovered.</event>
        /// <event name="axislabelclick">Fires when an axis label is clicked.</event>
        /// <event name="plotareaclick">Fires when the plot area is clicked.</event>
        /// <part name="chart" class="k-chart">The RadChart widget.</part>
        /// <part name="tooltip" class="k-tooltip">The tooltip of the chart.</part>
        /// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
        /// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
    var RadChart = derive(ui.WidgetWrapper, function (element, options) {
        /// <summary>
        /// Creates a new RadChart control.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
        /// <param name="options" type="Object">The initialization options for this control.</param>
}, {
        /// <field type="Telerik.Data.DataSource">
        /// Gets or sets the data source object for this control.
        /// </field>
        dataSource: {get:function(){}, set:function(value){}},
        /// <field type="Boolean" defaultValue="true">
        /// Enables or disables transitions. True by default.
        /// </field>
        transitions: defineProperty("transitions", true),
        /// <field type="String">
        /// Gets or sets the visual theme of the chart.
        /// </field>
        theme: defineProperty("theme", "dark"),
        /// <field type="Array" elementType="String">
        /// Gets or sets the color collection that will be used for styling the chart series.
        /// Array elements must be valid CSS color definitions.
        /// </field>
        seriesColors: defineProperty("seriesColors", []),
        /// <field type="String">
        /// Gets or sets the background of the chart area.
        /// </field>
        background: defineProperty("background", "none"),
        /// <field type="Telerik.UI.Common._BorderConfiguration">
        /// Gets the border settings of the chart area.
        /// </field>
        border: {get:function(){}},
        /// <field type="Number" defaultValue="600">
        /// Gets or sets the width of the chart area in pixels.
        /// </field>
        width: defineProperty("width", 600),
        /// <field type="Number" defaultValue="400">
        /// Gets or sets the height of the chart area in pixels.
        /// </field>
        height: defineProperty("height", 400),
        /// <field type="Telerik.UI.Common._BoxConfiguration">
        /// Gets the margin settings of the chart area.
        /// </field>
        margin: {get:function(){}},
        /// <field type="Telerik.UI.Chart._TitleConfiguration">
        /// Gets the title settings of the chart.
        /// </field>
        title: {get:function(){}},
        /// <field type="Telerik.UI.Chart._LegendConfiguration">
        /// Gets the legend settings of the chart.
        /// </field>
        legend: {get:function(){}},
        /// <field type="Telerik.UI.Chart._TooltipConfiguration">
        /// Gets the tooltip settings of the chart.
        /// </field>
        tooltip: {get:function(){}},
        /// <field type="Telerik.UI.Chart._PlotAreaConfiguration">
        /// Gets the plot are settings.
        /// </field>
        plotArea: {get:function(){}},
        /// <field type="Telerik.UI.Chart._AxisConfiguration">
        /// Gets the default settings that apply to all axes.
        /// </field>
        axisDefaults: {get:function(){}},
        /// <field type="Telerik.UI.Chart._AxisConfiguration">
        /// Gets the value axis settings.
        /// </field>
        valueAxis: {get:function(){}},
        /// <field type="Telerik.UI.Chart._CategoryAxisConfiguration">
        /// Gets the category axis settings.
        /// </field>
        categoryAxis: {get:function(){}},
        /// <field type="Telerik.UI.Chart._AxisConfiguration">
        /// Gets the X axis settings when a scatter chart type is used.
        /// </field>
        xAxis: {get:function(){}},
        /// <field type="Telerik.UI.Chart._AxisConfiguration">
        /// Gets the Y axis settings when a scatter chart type is used.
        /// </field>
        yAxis: {get:function(){}},
        /// <field type="Telerik.UI.Chart.Series">
        /// Gets the default settings common to all series.
        /// </field>
        seriesDefaults: {get:function(){}, set:function(value){}},
        /// <field type="Array">
        /// Gets or sets the data series in the chart.
        /// </field>
        series: {get:function(){}, set:function(value){}},
        /// <field type="String" readonly="true" hidden="true">
        /// Gets the SVG representation of the current chart.
        /// </field>
        svg: {get:function(){}},
        refresh: function () {
            /// <summary>
            /// Reloads the data and repaints the chart.
            /// </summary>
},
        redraw: function () {
            /// <summary>
            /// Repaints the chart.
            /// </summary>
}
    });
    namespace("Telerik.UI", {
        RadChart: RadChart
    });
    mix(RadChart, utilities.createEventProperties("databound", "seriesclick", "serieshover", "axislabelclick", "plotareaclick"));
})(this, jQuery);
(function () {
    var kendo = window.kendo,
        dataviz = kendo.dataviz,
        deepExtend = kendo.deepExtend;
    var BLACK = "#000",
        GREY = "#808080",
        NONE = "none",
        OUTSIDEEND = "outsideEnd",
        SEGOE = "Segoe UI",
        SEMIBOLD = " Semibold",
        SEGOE11 = "11px " + SEGOE,
        SEGOE11SEMIBOLD = SEGOE11 + SEMIBOLD,
        SEGOE12 = "12px " + SEGOE,
        SEGOE12SEMIBOLD = SEGOE12 + SEMIBOLD,
        SEGOE14 = "14px " + SEGOE,
        SEGOE30 = "30px " + SEGOE,
        WHITE = "#fff";
    var chartBaseTheme = {
        title: {
            font: SEGOE30
        },
        axisDefaults: {
            title: {
                font: SEGOE11SEMIBOLD
            },
            labels: {
                font: SEGOE11
            }
        },
        tooltip: {
            font: SEGOE14,
            color: BLACK,
            background: WHITE
        },
        legend: {
            labels: {
                font: SEGOE11
            }
        },
        seriesDefaults: {
            overlay: {
                gradient: NONE
            },
            labels: {
                position: OUTSIDEEND,
                font: SEGOE12SEMIBOLD,
                background: "",
                color: ""
            },
            area: {
                opacity: 0.4
            },
            verticalArea: {
                opacity: 0.4
            },
            bar: {
                tooltip: {
                    border: {
                        color: GREY,
                        width: 2
                    }
                }
            },
            column: {
                tooltip: {
                    border: {
                        color: GREY,
                        width: 2
                    }
                }
            },
            pie: {
                overlay: {
                    gradient: "roundedBevel"
                },
                tooltip: {
                    border: {
                        color: GREY,
                        width: 2
                    }
                }
            }
        },
        seriesColors: [
            "#1E98E4", "#FFC500", "#FF2A00", "#CACACA", "#434343",
            "#00FF9C", "#6D31FF", "#00B2A1", "#B9FF85", "#FF8000"
        ]
    };
    var BLACKCHARTTITLE = "#292929",
        BLACKAXISTITLE = BLACKCHARTTITLE,
        BLACKAXISLABEL = "#4B4B4B",
        BLACKLEGENDLABELS = BLACKAXISLABEL,
        BLACKRGBANOFILTER = "rgba(0, 0, 0, ",
        BLACK14PERCENT = BLACKRGBANOFILTER + "0.14)",
        BLACK19PERCENT = BLACKRGBANOFILTER + "0.19)",
        BLACK35PERCENT = BLACKRGBANOFILTER + "0.35)",
        WHITERGBANOFILTER = "rgba(255, 255, 255, ",
        WHITE12PERCENT = WHITERGBANOFILTER + "0.12)",
        WHITE35PERCENT = WHITERGBANOFILTER + "0.35)",
        WHITE40PERCENT = WHITERGBANOFILTER + "0.4)",
        WHITE60PERCENT = WHITERGBANOFILTER + "0.6)",
        WHITE80PERCENT = WHITERGBANOFILTER + "0.8)";
    var chartThemes = {
        dark: deepExtend({}, chartBaseTheme, {
            title: {
                color: WHITE80PERCENT
            },
            legend: {
                labels: {
                    color: WHITE40PERCENT
                }
            },
            axisDefaults: {
                title: {
                    color: WHITE60PERCENT
                },
                labels: {
                    color: WHITE40PERCENT
                },
                line: {
                    color: WHITE35PERCENT
                },
                majorGridLines: {
                    color: WHITE12PERCENT
                }
            },
            chartArea: {
                background: NONE
            },
            seriesDefaults: {
                labels: {
                    color: "#CACACA"
                }
            }
        }),
        light: deepExtend({}, chartBaseTheme, {
            title: {
                color: BLACKCHARTTITLE
            },
            legend: {
                labels: {
                    color: BLACKLEGENDLABELS
                }
            },
            axisDefaults: {
                title: {
                    color: BLACKAXISTITLE
                },
                labels: {
                    color: BLACKAXISLABEL
                },
                line: {
                    color: BLACK35PERCENT
                },
                majorGridLines: {
                    color: BLACK14PERCENT
                }
            },
            seriesDefaults: {
                labels: {
                    color: "#545454"
                }
            }
        })
    };
    deepExtend(dataviz.ui.themes, {
        chart: chartThemes
    });
})();/// <reference path="//Microsoft.WinJS.1.0/js/base.js" />
/// <reference path="/jquery/jquery-1.7.2.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
    "use strict";
    var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
        util = Telerik.Utilities;
        /// <summary>
        /// An input control that allows selecting one of some predefined values from a drop-down or entering a custom value.
        /// </summary>
        /// <icon src="combobox_html_12.png" width="12" height="12" />
        /// <icon src="combobox_html_16.png" width="16" height="16" />
        /// <htmlSnippet><![CDATA[<span data-win-control="Telerik.UI.RadComboBox"></span>]]></htmlSnippet>
        /// <event name="open">Fires when the drop-down list of RadAutoComplete is shown.</event>
        /// <event name="close">Fires when the drop-down list of RadAutoComplete is closed.</event>
        /// <event name="select">Fires when an item is selected from the drop-down list.</event>
        /// <event name="change">Fires when the value of the RadAutoComplete changes.</event>
        /// <event name="databinding">Fires when the control is about to databind.</event>
        /// <event name="databound">Fires immediately after the control is databound.</event>
        /// <part name="comboBox" class="k-combobox">The RadComboBox widget.</part>
        /// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
        /// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
    var RadComboBox = derive(ui.ListBase, function (element, options) {
        /// <summary>
        /// Creates a new RadComboBox control.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
        /// <param name="options" type="Object">The initialization options for this control.</param>
}, {
        /// <field type="Number" integer="true">
        /// Gets or sets the zero-based index of the selected item.
        /// </field>
        index: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the type of filtration to use when filtering the data items.
        /// </field>
        filter: {get:function(){}, set:function(value){}},
        /// <field type="Number" integer="true">
        /// Gets or sets the minimum amount of characters that should be typed before RadComboBox queries the dataSource.
        /// </field>
        minLength: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the string that appears in the textbox when it has no value.
        /// </field>
        placeholder: {get:function(){}, set:function(value){}},
        /// <field type="Boolean">
        /// Gets or sets a value indicating whether RadComboBox should automatically auto-type the rest of text.
        /// </field>
        autoSuggest: {get:function(){}, set:function(value){}},
        open: function () {
            /// <summary>
            /// Opens the drop-down list.
            /// </summary>
},        
        toggle: function (toggle) {
            /// <summary>
            /// Toggles the drop-down list between its open and closed state.
            /// </summary>
            /// <param name="toggle" type="Boolean">Optional. Specifies whether to open or close the drop-down list.</param>
},
        suggest: function (value) {
            /// <summary>
            /// Forces a suggestion onto the text of the combobox.
            /// </summary>
            /// <param name="value" type="String">Characters to force a suggestion.</param>
},
        /// <field type="Boolean">
        /// Gets or sets a value indicating whether RadComboBox should automatically highlight the first shown item.
        /// </field>
        highlightFirst: {get:function(){}, set:function(value){}},
    });
    namespace("Telerik.UI", {
        RadComboBox: RadComboBox
    });
})(this, jQuery);/// <reference path="//Microsoft.WinJS.1.0/js/base.js" />
/// <reference path="/jquery/jquery-1.7.2.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
    "use strict";
    var win = WinJS,
        derive = win.Class.derive,
        mix = win.Class.mix,
        namespace = win.Namespace.define,
        utilities = win.Utilities,
        animation = win.UI.Animation,
        ui = Telerik.UI,
        datetimepickers = ui.DateTimePickers;
    var OBJECT = "object",
        STRING = "string",
        DIV = "DIV",
        DOT = ".",
        PX = "px",
        TDATEPICKER = "t-date-picker",
        TTIMEPICKER = "t-time-picker",
        TPICKER = "t-picker",
        THOVER = "t-hover",
        TPRESS = "t-press",
        TINPUT = "t-input",
        TARROW = "t-arrow",
        TDATESELECTOR = "t-date-selector",
        TTIMESELECTOR = "t-time-selector",
        THEADER = "t-header",
        TBODY = "t-body",
        TCOL = "t-col",
        TFOOTER = "t-footer",
        TOK = "t-ok",
        TCANCEL = "t-cancel",
        TDISABLED = "t-disabled",
        TEMPTY = "t-empty",
        CANCEL = "Cancel",
        OK = "OK",
        Y = 'y', M = 'm', D = 'd',
        YEAR = "year", MONTH = "month", DAY = "day",
        H = 'h', T = 't',
        HOUR = 'hour', MINUTE = 'minute', PERIOD = 'period',
        EMPTYSTRING = "",
        SELECTDATE = "Select Date",
        SELECTTIME = "Select Time",
        LEAPYEAR = "Leap Year",
        CHANGE = "change",
        OPEN = "open",
        CLOSE = "close",
        OK_LOWERCASE = "ok",
        AM = "AM", PM = "PM",
        NULL = null,
        TRUE = true,
        FALSE = false,
        ZERO = 0,
        ONE = 1,
        TWELVE = 12,
        TEN = 10,
        TWENTYTHREE = 23,
        FIFTYNINE = 59,
        SEVENTY = 70,
        THREE = 3,
        ITEMCOUNT = 3,
        ITEMLENGTH = 70,
        ITEMSPACING = 10,
        DATESELECTORITEMTEMPLATE =
            "<div class='t-template'>" +
                "<div></div><div></div><div></div>" +
                "<div></div><div>#= value #</div><div></div>" +
                "<div></div><div class='t-label'>#= label #</div><div></div>" +
            "</div>",
        TIMESELECTORITEMTEMPLATE =
            "<div class='t-template'>" +
                "<div></div><div></div><div></div>" +
                "<div></div><div>#= value #</div><div></div>" +
                "<div></div><div></div><div></div>" +
            "</div>";
    var tryParseObject = function (value) {
        if (typeof value == STRING) {
            var trimmed = value.trim();
            if (trimmed[0] == "{" && trimmed[trimmed.length - 1] == "}")
                return JSON.parse(trimmed);
        }
        return value;
    };
    var _DateTimePicker = derive(ui.Control, function (element, options) {
        /// <summary>
        /// Creates a new RadDatePicker/RadTimePicker control.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
        /// <param name="options" type="Object">The initialization options for this control.</param>
}, {
        /// <field type="Date">
        /// Gets or sets the value of the picker. (Only the date/time part of the Date object
        /// will be applied.) It can be null/undefined (not set).
        /// </field>
        value: {get:function(){}, set:function(value){}},
        /// <field type="String" readonly="true">
        /// Gets the string representation of the current value. 
        /// The string representation is the current value formatted 
        /// according to the settings of the device and the control.
        /// </field>
        valueString: {get:function(){}},
        /// <field type="Date">
        /// Gets or sets the minimum value of the value range for the control.
        /// (Only the date/time part of the Date object will be applied.)
        /// </field>
        minValue: {get:function(){}, set:function(value){}},
        /// <field type="Date">
        /// Gets or sets the maximum value of the value range for the control.
        /// (Only the date/time part of the Date object will be applied.)
        /// </field>
        maxValue: {get:function(){}, set:function(value){}},
        /// <field type="Number" Integer="true">
        /// Gets or sets the number of items visible within the selector part of the control.
        /// This property is used to determine the height of the selector part when opened. 
        /// The calculated height will not exceed the height of the view port.
        /// Pass non-positive value to stretch the selector vertically.
        /// </field>
        itemCount: {get:function(){}, set:function(value){}},
        /// <field type="Number" Integer="true">
        /// Gets or sets the length (width and height) of the items that appear in the selector part of the control.
        /// </field>
        itemLength: {get:function(){}, set:function(value){}},
        /// <field type="Number" Integer="true">
        /// Gets or sets the spacing between the items that appear in the selector part of the control.
        /// This propery also determines the spacing between the different 
        /// parts of the selector, e.g. lists, buttons, header.
        /// </field>
        itemSpacing: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the selector format. This value defines how the different selector components will be ordered. 
        /// By setting this property, you can also define which editable parts of the selector will be visible. 
        /// For example �y/m� will display the Year and Month components in a DatePicker.
        /// Valid values are:
        /// * h - hour, m - minute, t - period [AM/PM] if applicable for a TimePicker;
        /// * y - year, m - month, d - dat for a DatePicker;
        /// </field>
        selectorFormat: {get:function(){}, set:function(value){}},
        /// <field type="Date">
        /// Gets or sets the value that represents the default value displayed in the selector part. 
        /// The default value is shown when the value property is not set (null/undefined).
        /// If no default value is specified, the current date/time on the system is displayed when the selector opens.
        /// </field>
        selectorDefaultValue: {get:function(){}, set:function(value){}},
        /// <field type="Boolean">
        /// Gets or sets a value determining whether the selector part of the control is open.
        /// </field>
        isSelectorOpen: {get:function(){}, set:function(value){}},
        /// <field type="Boolean">
        /// Gets or sets a value determining whether the control is in read only mode. 
        /// If set to true, the control does not allow the user to modify its value.
        /// </field>
        isReadOnly: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets a string representing the value format for the control. 
        /// The value format determines how the edited value is displayed on the screen after it has been selected. 
        /// If not set, the format from the current system clock configuration is used.
        /// </field>
        displayValueFormat: {get:function(){}, set:function(value){}},
        /// <field type="Boolean">
        /// Gets or sets a value indicating whether the control will automatically calculate its picker width,
        /// so that it equals the width of the selector part.
        /// </field>
        autoSizeWidth: {get:function(){}, set:function(value){}},
        /// <field type="Boolean">
        /// Gets or sets a value indicating whether the control is enabled (default).
        /// </field>
        enabled: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets a value determining how the items in all lists in the selector will be rendered.
        /// With this propery the default template can be overriden.
        /// Internally all items are bound to a data object having two fields: 'value' and 'label'.
        /// These correspond to the number of year, month, hour, etc. and to the name of the
        /// month, day and whether the year is leap respectively. In order to utilize either or both of the
        /// data object properties the template should have mappings to them, e.g.
        /// <div>#= value #</div>'#= label #'
        /// </field>
        itemTemplate: {get:function(){}, set:function(value){}},
        /// <field type="Object">
        /// Gets or sets the header displayed in the selector.
        /// By default the 'Select Date' text is shown.
        /// This property value can be either a string or a data object.
        /// If the value is an object, the selectorHeaderTemplate property must also be set
        /// to specify which properties of the object will be rendered.
        /// </field>
        selectorHeader: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets a value determining how the selectorHeader property value will be rendered.
        /// If the selectorHeader property is of a primitive type, this property should not be set - 
        /// the value will render as text.
        /// If the selectorHeader is an object the template should specify mappings in the form #= objectPropertyName #.
        /// Example:
        /// <div class="selector-header">#= value #</div>
        /// provided that the selectorHeader property is set to { value: 'Header Text' }.
        /// </field>
        selectorHeaderTemplate: {get:function(){}, set:function(value){}},
        /// <field type="Object">
        /// Gets or sets the object that represents the header content.
        /// This property value can be either a string or a data object.
        /// If the value is an object, the headerTemplate property must also be set
        /// to specify which properties of the object will be rendered.
        /// </field>
        header: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets a value determining how the header property value will be rendered.
        /// If the header property is of a primitive type, this property should not be set - 
        /// the value will render as text.
        /// If the header is an object the template should specify mappings in the form #= objectPropertyName #.
        /// Example:
        /// <div class="header">#= value #</div>
        /// provided that the header property is set to { value: 'Header Text' }.
        /// </field>
        headerTemplate: {get:function(){}, set:function(value){}},
        /// <field type="Object">
        /// Gets or sets the empty content of the picker part of the control. 
        /// The empty content is displayed when there is no value defined.
        /// This property value can be either a string or a data object.
        /// If the value is an object, the headerTemplate property must also be set
        /// to specify which properties of the object will be rendered.
        /// </field>
        emptyContent: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets a value determining how the emptyContent property value will be rendered.
        /// If the emptyContent property is of a primitive type, this property should not be set - 
        /// the value will render as text.
        /// If the emptyContent is an object the template should specify mappins in the form #= objectPropertyName #.
        /// Example:
        /// <div class="empty-content">#= value #</div>
        /// provided that the emptyContent property is set to { value: 'Empty' }.
        /// </field>
        emptyContentTemplate: {get:function(){}, set:function(value){}},
        });
        /// <summary>
        /// Allows the selection of a date value from maximum three different components:
        /// year/month/day via intuitive and easy to use vertical looping lists that show in a popup.
        /// </summary>
        /// <icon src="datepicker_html_12.png" width="12" height="12" />
        /// <icon src="datepicker_html_16.png" width="16" height="16" />
        /// <htmlSnippet><![CDATA[<span data-win-control="Telerik.UI.RadDatePicker"></span>]]></htmlSnippet>
        /// <event name="open">Fires after the selector popup opens.</event>
        /// <event name="close">Fires after the selecotr popup closes.</event>
        /// <event name="change">Fires when the date is changed via the selector.</event>
        /// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
        /// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
    var RadDatePicker = derive(_DateTimePicker, function (element, options) {
        /// <summary>
        /// Create a new RadDatePicker control that allows selection of a date using year/month/day pickers.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
        /// <param name="options" type="Object">The initialization options for this control.</param>
}, {
        });
        /// <summary>
        /// Allows the selection of a time value from maximum three different components:
        /// hour/minute/perio via intuitive and easy to use vertical looping lists that show in a popup.
        /// </summary>
        /// <icon src="timepicker_html_12.png" width="12" height="12" />
        /// <icon src="timepicker_html_16.png" width="16" height="16" />
        /// <htmlSnippet><![CDATA[<span data-win-control="Telerik.UI.RadTimePicker"></span>]]></htmlSnippet>
        /// <event name="open">Fires after the selector popup opens.</event>
        /// <event name="close">Fires after the selecotr popup closes.</event>
        /// <event name="change">Fires when the time is changed via the selector.</event>
        /// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
        /// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
    var RadTimePicker = derive(_DateTimePicker, function (element, options) {
        /// <summary>
        /// Create a new RadDatePicker control that allows selection of a time using hour/minute/period pickers.
        /// </summary>
    	/// <param name="element" domElement="true">The HTML element that hosts this control.</param>
        /// <param name="options" type="Object">The initialization options for this control.</param>
}, {
        });
    var _DateTimeSelector = derive(ui.Control, function (element, options) {
}, {
        itemCount: {get:function(){}, set:function(value){}},
        itemSpacing: {get:function(){}, set:function(value){}},
        itemLength: {get:function(){}, set:function(value){}},
        format: {get:function(){}, set:function(value){}},
        value: {get:function(){}, set:function(value){}},
        minValue: {get:function(){}, set:function(value){}},
        maxValue: {get:function(){}, set:function(value){}},
        isOpen: {get:function(){}},
        headerContent: {get:function(){}, set:function(value){}},
        headerTemplate: {get:function(){}, set:function(value){}},
        itemTemplate: {get:function(){}, set:function(value){}},
        open: function () {
},
        close: function () {
}
        });
    var _DateSelector = derive(_DateTimeSelector, function (element, options) {
}, {
        });
    var _TimeSelector = derive(_DateTimeSelector, function (element, options) {
}, {
        });
    var _YearList = derive(datetimepickers._LoopingList, function (element, options) {
}, {
        });
    var _MonthList = derive(datetimepickers._LoopingList, function (element, options) {
}, {
        });
    var _DayList = derive(datetimepickers._LoopingList, function (element, options) {
}, {
        updateRangeEnd: function (date) {
}
    });
    var _HourList = derive(datetimepickers._LoopingList, function (element, options) {
}, {
        });
    var _MinuteList = derive(datetimepickers._LoopingList, function (element, options) {
}, {
        });
    var _PeriodList = derive(datetimepickers._SlidingList, function (element, options) {
}, {
        });
    mix(_DateTimePicker, win.Utilities.eventMixin,
        win.Utilities.createEventProperties(CHANGE, OPEN, CLOSE));
    mix(_DateTimeSelector, win.Utilities.eventMixin,
        win.Utilities.createEventProperties(OK, OPEN, CLOSE));
    namespace("Telerik.UI.DateTimePickers", {
        _DateTimePicker: _DateTimePicker,
        _DateTimeSelector: _DateTimeSelector,
        _DateSelector: _DateSelector,
        _TimeSelector: _TimeSelector,
        _YearList: _YearList,
        _MonthList: _MonthList,
        _DayList: _DayList,
        _HourList: _HourList,
        _MinuteList: _MinuteList,
        _PeriodList: _PeriodList
    });
    namespace("Telerik.UI", {
        RadDatePicker: RadDatePicker,
        RadTimePicker: RadTimePicker
    });
})(this, jQuery);/// <reference path="//Microsoft.WinJS.1.0/js/base.js" />
/// <reference path="/jquery/jquery-1.7.2.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
    "use strict";
    var win = WinJS,
        derive = win.Class.derive,
        namespace = win.Namespace.define,
        ui = Telerik.UI;
        /// <summary>
        /// Allows selection of a single value from a list in a dropdown.
        /// </summary>
        /// <icon src="dropdownlist_html_12.png" width="12" height="12" />
        /// <icon src="dropdownlist_html_16.png" width="16" height="16" />
        /// <htmlSnippet><![CDATA[<span data-win-control="Telerik.UI.RadDropDownList"></span>]]></htmlSnippet>
        /// <event name="open">Fires when the drop-down list of RadAutoComplete is shown.</event>
        /// <event name="close">Fires when the drop-down list of RadAutoComplete is closed.</event>
        /// <event name="select">Fires when an item is selected from the drop-down list.</event>
        /// <event name="change">Fires when the value of the RadAutoComplete changes.</event>
        /// <event name="databinding">Fires when the control is about to databind.</event>
        /// <event name="databound">Fires immediately after the control is databound.</event>
        /// <part name="dropDownList" class="k-dropdown">The RadDropDownList widget.</part>
        /// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
        /// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
    var RadDropDownList = derive(ui.ListBase, function (element, options) {
        /// <summary>
        /// Creates a new RadDropDownList control.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
        /// <param name="options" type="Object">The initialization options for this control.</param>
}, {
        /// <field type="Number" integer="true">
        /// Gets or sets the zero-based index of the selected item.
        /// </field>
        index: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the text of the default empty item.
        /// </field>
        optionLabel: {get:function(){}, set:function(value){}},
        open: function () {
        	/// <summary>
        	/// Opens the drop-down list.
            /// </summary>
},        
        search: function (word) {
        	/// <summary>
        	/// Selects the item that starts with the specified substring.
        	/// </summary>
            /// <param name="word" type="String">The value to search by.</param>
},
        toggle: function (toggle) {
        	/// <summary>
        	/// Toggles the drop-down list between its open and closed state.
        	/// </summary>
            /// <param name="toggle" type="Boolean">Optional. Specifies whether to open or close the drop-down list.</param>
}
    });
    namespace("Telerik.UI", {
        RadDropDownList: RadDropDownList
    });
})(this, jQuery);/// <reference path="//Microsoft.WinJS.1.0/js/base.js" />
/// <reference path="/jquery/jquery-1.7.2.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
    var win = WinJS,
        derive = win.Class.derive,
        utilities = win.Utilities,
        namespace = win.Namespace.define,
        ui = Telerik.UI,
        util = Telerik.Utilities,
        nsName = "Telerik.UI.Gauge",
        ns = namespace(nsName),
        common = ui.Common,
        extend = $.extend,
        NUMBER = "number",
        OBJECT = "object",
        ARRAY = "array",
        NULL = null,
        RADIX = 10,
        config = ui._ControlConfiguration,
        defineProperty = config.defineProperty,
        getMapping = config.getMapping,
        priv = util.setPrivate;
    namespace(nsName, {
        _LabelConfiguration: derive(ui._ControlConfiguration, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of the gauge labels.
            /// </summary>
}, {
            /// <field type="String">
            /// Gets or sets the background of the gauge labels. Any valid CSS color string is accepted.
            /// </field>
            background: defineProperty("background", ""),
            /// <field type="Telerik.UI.Common._BorderConfiguration">
            /// Gets the border settings of the gauge labels.
            /// </field>
            border: {get:function(){}},
            /// <field type="String">
            /// Gets or sets the text color of the gauge labels. Any valid CSS color string is accepted.
            /// </field>
            color: defineProperty("color", ""),
            /// <field type="String">
            /// Gets or sets the font style of the gauge labels.
            /// </field>
            font: defineProperty("font", ""),
            /// <field type="String">
            /// Gets or sets the format of the gauge labels.
            /// </field>
            format: defineProperty("format", ""),
            /// <field type="Telerik.UI.Common._BoxConfiguration">
            /// Retrieves the margin settings of the gauge labels.
            /// </field>
            margin: {get:function(){}},
            /// <field type="Telerik.UI.Common._BoxConfiguration">
            /// Retrieves the padding settings of the gauge labels.
            /// </field>
            padding: {get:function(){}},
            /// <field type="String">
            /// Gets or sets the template of the gauge labels.
            /// </field>
            template: defineProperty("template", ""),
            /// <field type="Boolean">
            /// Gets or sets the visibility of the gauge labels. Default value is true.
            /// </field>
            visible: defineProperty("visible", true)
        }),
        _TickConfiguration: derive(ui._ControlConfiguration, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of the gauge ticks.
            /// </summary>
}, {
            /// <field type="String">
            /// Gets or sets the color of the ticks. Any valid CSS color string is accepted.
            /// </field>
            color: defineProperty("color", "#000"),
            /// <field type="Number">
            /// Gets or sets the tick length in pixels.
            /// </field>
            size: defineProperty("size", 0),
            /// <field type="Boolean" defaultValue="true">
            /// Gets or sets the visibility of the ticks. Default is true.
            /// </field>
            visible: defineProperty("visible", true),
            /// <field type="Number" defaultValue="0.5">
            /// Gets or sets the width of the ticks in pixels. Default is 0.5
            /// </field>
            width: defineProperty("width", 0.5)
        }),
        _RadialPointerConfiguration: derive(ui._ControlConfiguration, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of the radial gauge pointer.
            /// </summary>
}, {
            /// <field type="Number">
            /// Gets or sets the size of the value in percents (from 0 to 1).
            /// </field>
            capSize: defineProperty("capSize", 0.5),
            /// <field type="String">
            /// Gets or sets the color of the pointer cap. Any valid CSS color string is accepted.
            /// </field>
            capColor: defineProperty("capColor", ""),
            /// <field type="String">
            /// Gets or sets the color of the pointer. Any valid CSS color string is accepted.
            /// </field>
            color: defineProperty("color", "")
        }),
        _LinearPointerTrackConfiguration: derive(ui._ControlConfiguration, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of the linear pointer track.
            /// </summary>
}, {
            /// <field type="Telerik.UI.Common._BorderConfiguration">
            /// Gets the border settings for the gauge pointer track.
            /// </field>
            border: {get:function(){}},
            /// <field type="String">
            /// Gets or sets the color of the pointer track. Any valid CSS color string is accepted.
            /// </field>
            color: defineProperty("color", ""),
            /// <field type="Number" defaultValue="1">
            /// Gets or sets the opacity of the pointer track.
            /// </field>
            opacity: defineProperty("opacity", 1),
            /// <field type="Number">
            /// Gets or sets the size of the pointer track.
            /// </field>
            size: defineProperty("size", 0),
            /// <field type="Boolean">
            /// Gets or sets the visibility of the pointer track.
            /// </field>
            visible: defineProperty("visible", false)
        }),
        _LinearPointerConfiguration: derive(ui._ControlConfiguration, function (owner, parentMapping, defaults) {
            /// <summary>
            /// For internal usage only. Describes the properties of the linear gauge pointer.
            /// </summary>
}, {
            /// <field type="Telerik.UI.Common._BorderConfiguration">
            /// Gets the border settings for the gauge pointer.
            /// </field>
            border: {get:function(){}},
            /// <field type="String">
            /// Gets or sets the color of pointer. Any valid CSS color string is accepted.
            /// </field>
            color: defineProperty("color", ""),
            /// <field type="Telerik.UI.Common._BoxConfiguration">
            /// Gets the margin settings of the pointer.
            /// </field>
            margin: {get:function(){}},
            /// <field type="Number" defaultValue="1">
            /// Gets or sets the opacity of the pointer. Default value is 1.
            /// </field>
            opacity: defineProperty("opacity", 1),
            /// <field type="String" defaultValue="barIndicator">
            /// Gets or sets the shape of the pointer. Possible values are "barIndicator" and "arrow". Default is "barIndicator."
            /// </field>
            /// <options>
            /// <option value="barIndicator">barIndicator</option>
            /// <option value="arrow">arrow</option>
            /// </options>
            shape: defineProperty("shape", "barIndicator"),
            /// <field type="Number">
            /// Gets or sets the size of the pointer.
            /// </field>
            size: defineProperty("size", 0),
            /// <field type="Telerik.UI.Gauge._LinearPointerTrackConfiguration">
            /// Retrieves the settings for the pointer track.
            /// </field>
            track: {get:function(){}}
        })
    });
        /// <excludetoc />
    var RadGauge = derive(ui.WidgetWrapper, function (element, options) {
        /// <summary>
        /// A base class for the RadLinearGauge and RadRadialGauge controls.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
        /// <param name="options" type="Object">The initialization options for this control.</param>
}, {
        /// <field type="String">
        /// Gets or sets the name of the visual theme applied to the gauge.
        /// </field>
        theme: defineProperty("theme", "dark"),
        /// <field type="String">
        /// Gets or sets the background of the gauge area. Any valid CSS color string is accepted.
        /// </field>
        background: defineProperty("background", "none"),
        /// <field type="Telerik.UI.Common._BorderConfiguration">
        /// Gets the border settings of the gauge area.
        /// </field>
        border: {get:function(){}},
        /// <field type="Number">
        /// Gets the width of the gauge area.
        /// </field>
        width: defineProperty("width", function () {
            var widget = this._widget,
                width = widget.options.gaugeArea.width;
            if (typeof width !== NUMBER) {
                width = widget.wrapper.find("svg").width();
            }
            return width;
        }),        
        /// <field type="Number">
        /// Gets the height of the gauge area.
        /// </field>
        height: defineProperty("height", function () {
            var widget = this._widget,
                height = widget.options.gaugeArea.height;
            if (typeof height !== NUMBER) {
                height = widget.wrapper.find("svg").height();
            }
            return height;
        }),        
        /// <field type="Telerik.UI.Common._BoxConfiguration" value="{left: 5, right: 5, top: 5, bottom: 5}">
        /// Gets the margin of the gauge area.
        /// </field>
        margin: {get:function(){}},
        /// <field type="Boolean" defaultValue="true">
        /// Enables or disables transitions. True by default.
        /// </field>
        transitions: defineProperty("transitions", true),
        /// <field type="Telerik.UI.Gauge._LabelConfiguration">
        /// Retrieves the label settings for this gauge.
        /// </field>
        labels: {get:function(){}},
        /// <field type="Number">
        /// Gets or sets the interval between minor divisions
        /// </field>
        minorUnit: defineProperty("minorUnit", function () {
            var that = this,
                minorUnit = parseFloat(that._widget.options.scale.minorUnit);
            return isNaN(minorUnit) ? that._getDefaultScale().options.minorUnit : minorUnit;
        }),        
        /// <field type="Number">
        /// Gets or sets the interval between major divisions
        /// </field>
        majorUnit: defineProperty("majorUnit", function () {
            var that = this,
                majorUnit = parseFloat(that._widget.options.scale.majorUnit);
            return isNaN(majorUnit) ? that._getDefaultScale().options.majorUnit : majorUnit;
        }),
        /// <field type="Number">
        /// Gets or sets the minimum value of the scale.
        /// </field>
        min: defineProperty("min", 0),        
        /// <field type="Number">
        /// Gets or sets the maximum value of the scale.
        /// </field>
        max: defineProperty("max", function () {
            var that = this,
                max = parseFloat(that._widget.options.scale.max),
                defaultMax = that instanceof ui.RadLinearGauge ? 50 : 100;
            return isNaN(max) ? defaultMax : max;
        }),
        /// <field type="Boolean">
        /// Gets or sets a value indicating whether the axis direction is reversed.
        /// Reversed axis values increase from right to left and from top to bottom.
        /// </field>
        reverse: defineProperty("reverse", false),
        /// <field type="Telerik.UI.Gauge._TickConfiguration">
        /// Retrieves the major tick settings.
        /// </field>
        majorTicks: {get:function(){}},
        /// <field type="Telerik.UI.Gauge._TickConfiguration">
        /// Retrieves the minor tick settings.
        /// </field>
        minorTicks: {get:function(){}},
        /// <field type="Array" elementType="{ from:0, to: 100, color: 'navy' }">
        /// Gets or sets the array of ranges that will appear on the scale.
        /// </field>
        ranges: defineProperty("ranges", []),
        /// <field type="Number">
        /// The width of the ranges that will appear on the scale. If the property is not set, it will be calculated to 10% of the scale radius.
        /// </field>
        rangeSize: defineProperty("rangeSize", null),
        /// <field type="String" hidden="true">
        /// Gets the SVG representation of the current gauge.
        /// </field>
        svg: {get:function(){}},
        /// <field type="Number">
        /// Gets or sets the current gauge value.
        /// </field>
        value: {get:function(){}, set:function(value){}},
        redraw: function () {
            /// <summary>
            /// Redraws the gauge.
            /// </summary>
}
    });
        /// <summary>
        /// A linear gauge control that can visualize a value on a linear scale.
        /// </summary>
        /// <icon src="lineargauge_html_12.png" width="12" height="12" />
        /// <icon src="lineargauge_html_16.png" width="16" height="16" />
        /// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadLinearGauge"></div>]]></htmlSnippet>
        /// <part name="linearGauge" class="k-gauge">The RadLinearGauge widget.</part>
        /// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
        /// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
    var RadLinearGauge = derive(RadGauge, function (element, options) {
        /// <summary>
        /// Creates a new RadLinearGauge control.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
        /// <param name="options" type="Object">The initialization options for this control.</param>
}, {
        /// <field type="Boolean">
        /// Gets or sets a value indicating whether the scale labels and ticks are mirrored. Mirroring the
        /// scale will render the labels and ticks on the opposite side.
        /// </field>
        mirror: defineProperty("mirror", false),
        /// <field type="Boolean">
        /// Gets or sets the position of the gauge.
        /// </field>
        vertical: defineProperty("vertical", true),
        /// <field type="Telerik.UI.Gauge._LinearPointerConfiguration">
        /// Retrieves the gauge pointer settings.
        /// </field>
        pointer: {get:function(){}}
    });
        /// <summary>
        /// A radial gauge control that can visualize a value on a radial scale.
        /// </summary>
        /// <icon src="radialgauge_html_12.png" width="12" height="12" />
        /// <icon src="radialgauge_html_16.png" width="16" height="16" />
        /// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadRadialGauge"></div>]]></htmlSnippet>
        /// <part name="radialGauge" class="k-gauge">The RadRadialGauge widget.</part>
        /// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
        /// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
    var RadRadialGauge = derive(RadGauge, function (element, options) {
        /// <summary>
        /// Creates a new RadRadialGauge control.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
        /// <param name="options" type="Object">The initialization options for this control.</param>
}, {
        /// <field type="Number">
        /// The distance of ranges from the edge of the scale. If this property is not set, it will be calculated to 5% of the scale radius.
        /// </field>
        rangeDistance: defineProperty("rangeDistance", function() {
            return this._widget._model._plotArea.scale.options.rangeDistance;
        }),
        /// <field type="Number">
        /// Gets or sets the start angle of the gauge scale. The scale is rendered clockwise,
        /// where a start angle of 0 is equal to 180 degrees in the polar coordinate system.
        /// </field>
        startAngle: defineProperty("startAngle", function() {
            return this._widget._model._plotArea.scale.options.startAngle;
        }),
        /// <field type="Number">
        /// Gets or sets the end angle of the gauge scale. The scale is rendered clockwise,
        /// where a start angle of 0 is equal to 180 degrees in the polar coordinate system.
        /// </field>
        endAngle: defineProperty("endAngle", function () {
            return this._widget._model._plotArea.scale.options.endAngle;
        }),
        /// <field type="Telerik.UI.Gauge._RadialPointerConfiguration">
        /// Retrieves the gauge pointer settings.
        /// </field>
        pointer: {get:function(){}}
    });
    namespace("Telerik.UI", {
        RadRadialGauge: RadRadialGauge,
        RadLinearGauge: RadLinearGauge
    });
})(this, jQuery);
// Skins =========================================
(function () {
    var kendo = window.kendo,
        dataviz = kendo.dataviz,
        deepExtend = kendo.deepExtend;
    var OUTSIDE = "outside",
        SEGOE = "Segoe UI",
        SEGOE15 = "15px " + SEGOE;
    var gaugeBaseTheme = {
        scale: {
            labels: {
                font: SEGOE15,
                position: OUTSIDE
            }
        }
    };
    var BLACKRGBANOFILTER = "rgba(0, 0, 0, ",
        BLACK60PERCENTFILTER = BLACKRGBANOFILTER + "0.6)",
        WHITE = "#fff",
        WHITERGBANOFILTER = "rgba(255, 255, 255, ",
        WHITE60PERCENTFILTER = WHITERGBANOFILTER + "0.6)";
    var gaugeThemes = {
        light: deepExtend({}, gaugeBaseTheme, {
            scale: {
                labels: {
                    color: BLACK60PERCENTFILTER
                },
                majorTicks: {
                    color: BLACK60PERCENTFILTER
                },
                minorTicks: {
                    color: BLACK60PERCENTFILTER
                },
                rangePlaceholderColor: BLACK60PERCENTFILTER
            }
        }),
        dark: deepExtend({}, gaugeBaseTheme, {
            pointer: {
                color: WHITE
            },
            scale: {
                labels: {
                    color: WHITE60PERCENTFILTER
                },
                majorTicks: {
                    color: WHITE60PERCENTFILTER
                },
                minorTicks: {
                    color: WHITE60PERCENTFILTER
                },
                rangePlaceholderColor: WHITE60PERCENTFILTER
            }
        })
    };
    deepExtend(dataviz.ui.themes, {
        gauge: gaugeThemes
    });
})();/// <reference path="//Microsoft.WinJS.1.0/js/base.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
	"use strict";
	var derive = WinJS.Class.derive,
		mix = WinJS.Class.mix,
		namespace = WinJS.Namespace.define,
		ui = Telerik.UI;
	/// <event name="tileinvoked" bubbles="true">Raised when the user taps or clicks on the hub tile.</event>
	var _HubTileBase = derive(ui.Control, function (element, options) {
}, {
		/// <field type="Number" integer="true" defaultValue="3">
		/// Gets or sets the UpdateInterval in seconds. This interval determines how often the tile will
		/// update its visual states when it is not frozen.
		/// </field>
		updateInterval: {get:function(){}, set:function(value){}},
		/// <field type="Boolean" defaultValue="false">
		/// Gets or sets the IsFrozen property. Freezing a hub tile means that it will cease to
		/// periodically update itself. For example when it is offscreen.
		/// </field>
		isFrozen: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the Title.
		/// </field>
		title: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets a value determining what the backside of the tile will render.
		/// The value can be either a string with HTML or a DOM element. If the value is an element, its inner HTML will be used as the template.
		/// </field>
		backContentTemplate: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets a value determining what the front side of the tile will render.
		/// The value can be either a string with HTML or a DOM element. If the value is an element, its inner HTML will be used as the template.
		/// </field>
		});
	WinJS.Class.mix(_HubTileBase, WinJS.Utilities.createEventProperties("tileinvoked"));
	/// <summary>
	/// RadHubTile is the most commonly used tile. It consists of a title, an icon, a notification count and an optional message.
	/// </summary>
	/// <icon src="hubtile_html_12.png" width="12" height="12" />
	/// <icon src="hubtile_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadHubTile"></div>]]></htmlSnippet>
	/// <part name="hubtile" class="t-hubControl">The RadHubTile widget.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var _RadHubTile = derive(_HubTileBase, function (element, options) {
		/// <summary>
		/// Creates a new RadHubTile control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object">The initialization options for this control.</param>
}, {
		/// <field type="Number" integer="true">
		/// Gets or sets the notification count of the tile.
		/// </field>
		count: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the source of the tile image.
		/// </field>
		imageSource: {get:function(){}, set:function(value){}},
		/// <field type="String">
		/// Gets or sets the message of the tile.
		/// </field>
		message: {get:function(){}, set:function(value){}}
	});
	/// <summary>
	/// RadCustomHubTile defines a hub tile with custom front and back contents and a swivel transition between them.
	/// </summary>
	/// <icon src="hubtile_html_12.png" width="12" height="12" />
	/// <icon src="hubtile_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadCustomHubTile"></div>]]></htmlSnippet>
	/// <part name="hubtile" class="t-hubCustom">The RadCustomHubTile widget.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var _RadCustomHubTile = derive(_HubTileBase, function (element, options) {
		/// <summary>
		/// Creates a new RadCustomHubTile control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object">The initialization options for this control.</param>
}, {
		/// <field type="String">
		/// Gets or sets a value determining what the backside of the tile will render.
		/// The value can be either a string with HTML or a DOM element. If the value is an element, its inner HTML will be used as the template.
		/// </field>
		frontContentTemplate: {get:function(){}, set:function(value){}},
	});
	/// <summary>
	/// RadPictureRotatorHubTile defines a hub tile that shows a set of pictures.
	/// </summary>
	/// <icon src="hubtile_html_12.png" width="12" height="12" />
	/// <icon src="hubtile_html_16.png" width="16" height="16" />
	/// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadPictureRotatorHubTile"></div>]]></htmlSnippet>
	/// <part name="hubtile" class="t-hubPictureRotator">The RadPictureRotatorHubTile widget.</part>
	/// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
	/// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
	/// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
	var _RadPictureRotatorHubTile = derive(_HubTileBase, function (element, options) {
		/// <summary>
		/// Creates a new RadPictureRotatorHubTile control.
		/// </summary>
		/// <param name="element" domElement="true">The HTML element this control is associated with.</param>
		/// <param name="options" type="Object">The initialization options for this control.</param>
}, {
		/// <field type="Array">
		/// Gets or sets the images displayed by the tile.
		/// </field>
		imageSources: {get:function(){}, set:function(value){}},
	});
	namespace("Telerik.UI", {
		_HubTileBase: _HubTileBase,
		_RadHubTile: _RadHubTile,
		_RadCustomHubTile: _RadCustomHubTile,
		_RadPictureRotatorHubTile: _RadPictureRotatorHubTile
	});
})(this, jQuery);/// <reference path="//Microsoft.WinJS.1.0/js/base.js" />
/// <reference path="/jquery/jquery-1.7.2.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
    "use strict";
    var win = WinJS,
        derive = win.Class.derive,
        mix = win.Class.mix,
        namespace = win.Namespace.define,
        utilities = win.Utilities,
        ui = Telerik.UI,
        BOOLEAN = "boolean",
        NUMBER = "number",
        NULL = null,
        RADIX = 10,
        CONTAINERCSSCLASS = "t-numericbox",
        UPARROWSELECTOR = ".k-icon.k-i-arrow-n",
        DOWNARROWSELECTOR = ".k-icon.k-i-arrow-s",
        WIDGETINPUTSELECTOR = ".k-input:first-child",
        ARROWSWRAPPERSELECTOR = ".k-select";
        /// <summary>
        /// A textbox control for numeric input.
        /// </summary>
        /// <icon src="numericbox_html_12.png" width="12" height="12" />
        /// <icon src="numericbox_html_16.png" width="16" height="16" />
        /// <htmlSnippet><![CDATA[<span data-win-control="Telerik.UI.RadNumericBox"></span>]]></htmlSnippet>
        /// <event name="change">Fires when the value of RadNumericBox changes.</event>
        /// <event name="spin">Fires when any of the increment/decrement buttons is clicked.</event>
        /// <part name="numericBox" class="k-numerictextbox">The RadNumericBox widget.</part>
        /// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
        /// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
    var RadNumericBox = derive(ui.WidgetWrapper, function (element, options) {
        /// <summary>
        /// Creates a new RadNumericBox control.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
        /// <param name="options" type="Object">The initialization options for this control.</param>
}, {
        /// <field type="Boolean">
        /// Gets or sets the enabled state of the control.
        /// </field>
        enabled: {get:function(){}, set:function(value){}},
        /// <field type="Number" mayBeNull="true">
        /// Gets or sets the current numeric value.
        /// </field>
        value: {get:function(){}, set:function(value){}},
        /// <field type="Number" integer="true">
        /// Gets or sets the number precision. If not set precision defined by current culture is returned.
        /// </field>
        decimals: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the format of the number. Any valid number format is allowed.
        /// </field>
        format: {get:function(){}, set:function(value){}},
        /// <field type="Number" mayBeNull="true">
        /// Gets or sets the smallest value the user can enter.
        /// </field>
        min: {get:function(){}, set:function(value){}},
        /// <field type="Number" mayBeNull="true">
        /// Gets or sets the largest value the user can enter.
        /// </field>
        max: {get:function(){}, set:function(value){}},
        /// <field type="Number">
        /// Gets or sets the increment/decrement step.
        /// </field>
        step: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the text displayed when the input is empty.
        /// </field>
        placeholder: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the text of tooltip on the increment button.
        /// </field>
        incrementTooltip: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the text of tooltip on the decrement button.
        /// </field>
        decrementTooltip: {get:function(){}, set:function(value){}}
    });
    mix(RadNumericBox, utilities.createEventProperties("change", "spin"));
    namespace("Telerik.UI", {
        RadNumericBox: RadNumericBox
    });
})(this, jQuery);;/// <reference path="//Microsoft.WinJS.1.0/js/base.js" />
/// <reference path="/jquery/jquery-1.7.2.js" />
/// <reference path="/js/core.js" />
(function (global, $, undefined) {
    "use strict";
    var win = WinJS,
        derive = win.Class.derive,
        mix = win.Class.mix,
        namespace = win.Namespace.define,
        utilities = win.Utilities,
        telerik = Telerik,
        ui = telerik.UI,
        config = ui._ControlConfiguration,
        defineProperty = config.defineProperty,
        getMapping = config.getMapping,
        NULL = null,
        INCREASEARROWSELECTOR = ".k-icon.k-i-arrow-e",
        DECREASEARROWSELECTOR = ".k-icon.k-i-arrow-w",
        CONTAINERCSSCLASS = "t-slider"; //CSS rule needs 'display:inline-block'
    namespace("Telerik.UI.Slider", {
        _TooltipConfiguration: derive(config, function (owner, parentMapping, defaults, onchange) {
        	/// <summary>
            /// For internal usage only. Describes the properties of the slider tooltip.
        	/// </summary>
}, {
            /// <field type="Boolean" defaultValue="true">
            /// Gets or sets the enabled state of the slider tooltip.
            /// </field>
            enabled: defineProperty("enabled", true),
            /// <field type="String" defaultValue="{0}">
            /// Gets or sets the format of the slider tooltip. If a tooltip template is set,
            /// the value of this property will be ignored and the template will be used instead.
            /// </field>
            format: defineProperty("format", "{0}"),
            /// <field type="String">
            /// Gets or sets the template string that will be used for the content of the slider tooltip.
            /// A non-empty value for this property overrides the tooltip format when the tooltip is shown.
            /// </field>
            template: defineProperty("template", "")
        })
    });
        /// <excludetoc />
    var SliderBase = derive(ui.WidgetWrapper, function (element, options) {
        /// <summary>
        /// A base class for the RadRangeSlider and RadSlider controls.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
        /// <param name="options" type="Object">The initialization options for this control.</param>
}, {
        /// <field type="Boolean">
        /// Gets or sets the enabled state of the control.
        /// </field>
        enabled: {get:function(){}, set:function(value){}},
        /// <field type="Number" integer="true">
        /// Gets or sets the delta with which the value changes when the user presses
        /// PageUp or PageDown (the drag handle must be focused).
        /// </field>
        largeStep: {get:function(){}, set:function(value){}},
        /// <field type="Number" integer="true">
        /// Gets or sets the small step value of the slider. The slider value will change when
        /// the end user (1) clicks on the increase/decrease buttons, (2) presses the arrow keys
        /// (the drag handle must be focused), or (3) drags the drag handle.
        /// </field>
        smallStep: {get:function(){}, set:function(value){}},
        /// <field type="Number">
        /// Gets or sets the minimum value of the slider.
        /// </field>
        min: {get:function(){}, set:function(value){}},
        /// <field type="Number">
        /// Gets or sets the maximum value of the slider.
        /// </field>
        max: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the orientation of the slider. Allowed values are "horizontal" or "vertical".
        /// Default value is "horizontal".
        /// </field>
        /// <options>
        /// <option value="horizontal">horizontal</option>
        /// <option value="vertical">vertical</option>
        /// </options>
        orientation: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the location of the tick marks in the slider. The available options are
        /// "minorOutside", "minorMajorOutside", "inside" and "none". Default value is "minorMajorOutside".
        /// </field>
        /// <options>
        /// <option value="minorMajorOutside">minorMajorOutside</option>
        /// <option value="minorOutside">minorOutside</option>
        /// <option value="inside">inside</option>
        /// <option value="none">none</option>
        /// </options> 
        tickPlacement: {get:function(){}, set:function(value){}},
        /// <field type="Telerik.UI.Slider._TooltipConfiguration">
        /// Gets the configuration settings for the slider tooltip.
        /// </field>
        tooltip: {get:function(){}}
    });
    mix(SliderBase, utilities.createEventProperties("change", "slide"));
        /// <summary>
        /// A slider control for selecting values.
        /// </summary>
        /// <icon src="slider_html_12.png" width="12" height="12" />
        /// <icon src="slider_html_16.png" width="16" height="16" />
        /// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadSlider"></div>]]></htmlSnippet>
        /// <event name="change">Fires when the value of the slider is changed.</event>
        /// <event name="slide">Fires when the slide handle has moved.</event>
        /// <part name="slider" class="k-slider">The RadSlider widget.</part>
        /// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
        /// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
    var RadSlider = derive(SliderBase, function (element, options) {
        /// <summary>
        /// Creates a new RadSlider control.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
        /// <param name="options" type="Object">The initialization options for this control.</param>
}, {
        /// <field type="Number">
        /// Gets or sets the value of the slider.
        /// </field>
        value: {get:function(){}, set:function(value){}},
        /// <field type="Boolean">
        /// Gets or sets whether the increase and decrease buttons should be shown.
        /// </field>
        showButtons: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the tooltip of the increase button.
        /// </field>
        increaseButtonTooltip: {get:function(){}, set:function(value){}},
        /// <field type="String">
        /// Gets or sets the tooltip of the decrease button.
        /// </field>
        decreaseButtonTooltip: {get:function(){}, set:function(value){}}
    });
        /// <summary>
        /// A slider control for selecting a range of values.
        /// </summary>
        /// <icon src="rangeslider_html_12.png" width="12" height="12" />
        /// <icon src="rangeslider_html_16.png" width="16" height="16" />
        /// <htmlSnippet><![CDATA[<div data-win-control="Telerik.UI.RadRangeSlider"></div>]]></htmlSnippet>
        /// <event name="change">Fires when the value of the slider is changed.</event>
        /// <event name="slide">Fires when a slide handle has moved.</event>
        /// <part name="rangeSlider" class="k-slider">The RadRangeSlider widget.</part>
        /// <resource type="javascript" src="///Telerik.UI/js/jquery.js" shared="true" />
        /// <resource type="javascript" src="///Telerik.UI/js/ui.js" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/common.css" shared="true" />
        /// <resource type="css" src="///Telerik.UI/css/dark.css" shared="true" />
    var RadRangeSlider = derive(SliderBase, function (element, options) {
        /// <summary>
        /// Creates a new RadRangeSlider control.
        /// </summary>
        /// <param name="element" domElement="true">The HTML element this control is associated with.</param>
        /// <param name="options" type="Object">The initialization options for this control.</param>
}, {
        /// <field type="Array" elementType="Number">
        /// Gets or sets the start and end selection values of the range slider as an array of 2 elements.
        /// </field>
        values: {get:function(){}, set:function(value){}},
        /// <field type="Number">
        /// Gets or sets the starting value of the current range selection.
        /// </field>
        selectionStart: {get:function(){}, set:function(value){}},
        /// <field type="Number">
        /// Gets or sets the end value of the current range selection.
        /// </field>
        selectionEnd: {get:function(){}, set:function(value){}}
    });
    namespace("Telerik.UI", {
        RadSlider: RadSlider,
        RadRangeSlider: RadRangeSlider
    });
})(this, jQuery);