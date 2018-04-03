var setterMixin = (function (exports) {
'use strict';

/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
	var arguments$1 = arguments;

	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments$1[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

//Supposedly faster for v8 than just Object.create(null)
function Raw(){}
Raw.prototype = (function (){
    //Maybe some old browser has risen from it's grave
    if(typeof Object.create !== 'function'){
        var temp = new Object();
        temp.__proto__ = null;
        return temp;
    }

    return Object.create(null);
})();

function rawObject(){
    var arguments$1 = arguments;

    var objects = [], len = arguments.length;
    while ( len-- ) { objects[ len ] = arguments$1[ len ]; }

    var raw = new Raw();
    objectAssign.apply(void 0, [ raw ].concat( objects ));
    return raw;
}

function getProps(properties){
    var p = (properties + '');
    var ps = p.length === 1
    ? p
    : p
    .split(/\n+/).join('')
    .split(/(\[)([\s\S]+?)(\])/);

    var props = [];

    //If brackets are found there
    //will be a hanging empty string so
    if(ps[ps.length - 1] === ''){
        ps = ps.slice(0, -1);
        //When a bracket is at the first level
        if(ps[0] === ''){
            ps = ps.slice(1);
        }
    }

    for(var i=0; i<ps.length; i++){
        //Ignore dots between brackets
        if(ps[i] === '['){
            props.push(ps[++i]); ++i;
        }else{
            var items = ps[i].split('.');
            while(items.length){
                props.push(items.shift());
            }
        }
    }

    return props;
}

function getBase(src, props, end){
    if ( end === void 0 ) end = 1;

    var object = src;

    for(var i=0; i<props.length; i++){

        var prop = props[i];

        //It was objects the whole way so
        if(i === props.length - end){
            return {object: object, prop: prop}; //at the end
        }

        //Maybe the next object doesn't exist so
        if(object[props[i]] === void 0){
            object[props[i]] = rawObject();
        }

        object = object[props[i]];
    }

    return {object: object, prop: props[0]};
}

function setMasked(src, props, value, masks){
    var ref = getBase(src, props, 2);
    var object = ref.object;
    var prop = ref.prop;
    return object[masks[prop].set](props[props.length - 1], value);
}

function getMasked(src, props, masks){
    var ref = getBase(src, props, 2);
    var object = ref.object;
    var prop = ref.prop;
    return object[masks[prop].get](props[props.length - 1]);
}

function hasMask(props, masks){
    return props.length > 1 && masks[props[props.length - 2]] !== void 0;
}

function set(src, properties, value, defaults, masks){
    var obj = src;
    var props = getProps(properties);

    if(value === void 0){
        value = defaults[properties];
    }

    if(hasMask(props, masks)){
        return setMasked(obj, props, value, masks);
    }

    var ref = getBase(obj, props);
    var object = ref.object;
    var prop = ref.prop;
    object[prop] = value;
}

function get(src, properties, defaults, masks){
    var obj = src;
    var props = getProps(properties);
    var value;

    if(hasMask(props, masks)){
        value = getMasked(obj, props, masks);
    }else{
        var ref = getBase(obj, props);
        var object = ref.object;
        var prop = ref.prop;
        value = object[prop];
    }

    if(value === void 0){
        value = defaults[properties];
        if(value !== void 0){
            set(src, properties, value, {}, {});
        }
    }

    return value;
}

function setAll(obj, values, defaults, masks){
    var props = Object.keys(values);
    for(var i=0; i<props.length; i++){
        set(obj, props[i], values[props[i]], defaults, masks);
    }
}

function deleteMasked(src, properties, masks){
    var ref = getBase(src, props, 2);
    var object = ref.object;
    var prop = ref.prop;
    return object[masks[prop].delete](props[props.length - 1]);
}

function deleteProp(src, properties, masks){
    var obj = src;
    var props = getProps(properties);

    if(hasMask(props, masks)){
        deleteMasked(obj, props, masks);
    }else{
        var ref = getBase(obj, props);
        var object = ref.object;
        var prop = ref.prop;
        delete object[prop];
    }
}

function has(src, properties, defaults, masks){
    return get(src, properties, defaults, masks) !== void 0;
}

var QuickSetter = function QuickSetter(object, ref){
    if ( ref === void 0 ) ref = {};
    var defaults = ref.defaults; if ( defaults === void 0 ) defaults = {};
    var masks = ref.masks; if ( masks === void 0 ) masks = {};

    this.object = object;
    this.defaults = defaults;
    this.masks = masks;
};
QuickSetter.prototype.set = function set$1 (properties, value){
    set(this.object, properties, value, this.defaults, this.masks);
};
QuickSetter.prototype.get = function get$1 (properties){
    return get(this.object, properties, this.defaults, this.masks);
};
QuickSetter.prototype.setAll = function setAll$1 (obj){
    setAll(this.object, obj, this.defaults, this.masks);
};
QuickSetter.prototype.delete = function delete$1 (properties){
    deleteProp(this, properties, masks);
};
QuickSetter.prototype.has = function has$1 (properties){
    return has(this.object, properties, this.defaults, this.masks);
};

function q(object, options){
    return new QuickSetter(object, options);
}

function mixinSetter(proto, ref){
    if ( ref === void 0 ) ref = {};
    var defaults = ref.defaults; if ( defaults === void 0 ) defaults = {};
    var masks = ref.masks; if ( masks === void 0 ) masks = {};


    if(typeof defaults !== 'object'){
        defaults = {};
    }

    Object.assign(proto, {
        set: function set$1(properties, value){
            set(this, properties, value, defaults, masks);
        },
        get: function get$1(properties){
            return get(this, properties, defaults, masks);
        },
        setAll: function setAll$1(obj){
            setAll(this, obj, defaults, masks);
        },
        delete: function delete$1(properties){
            deleteProp(this, properties, masks);
        },
        has: function has$1(properties){
            return has(this, properties, defaults, masks);
        }
    });

    return proto;
}

exports.QuickSetter = QuickSetter;
exports.q = q;
exports.mixinSetter = mixinSetter;

return exports;

}({}));
//# sourceMappingURL=setter-mixin.js.map
