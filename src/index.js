import rawObject from 'raw-object';

function getProps(properties){
    let p = (properties + '');
    let ps = p.length === 1
    ? p
    : p
    .split(/\n+/).join('')
    .split(/(\[)([\s\S]+?)(\])/);

    let props = [];

    //If brackets are found there
    //will be a hanging empty string so
    if(ps[ps.length - 1] === ''){
        ps = ps.slice(0, -1);
        //When a bracket is at the first level
        if(ps[0] === ''){
            ps = ps.slice(1);
        }
    }

    for(let i=0; i<ps.length; i++){
        //Ignore dots between brackets
        if(ps[i] === '['){
            props.push(ps[++i]); ++i;
        }else{
            let items = ps[i].split('.');
            while(items.length){
                props.push(items.shift());
            }
        }
    }

    return props;
}

function getBase(src, props, end = 1){
    let object = src;

    for(let i=0; i<props.length; i++){

        let prop = props[i];

        //It was objects the whole way so
        if(i === props.length - end){
            return {object, prop}; //at the end
        }

        //Maybe the next object doesn't exist so
        if(object[props[i]] === void 0){
            object[props[i]] = rawObject();
        }

        object = object[props[i]];
    }

    return {object, prop: props[0]};
}

function setMasked(src, props, value, masks){
    let {object, prop} = getBase(src, props, 2);
    return object[masks[prop].set](props[props.length - 1], value);
}

function getMasked(src, props, masks){
    let {object, prop} = getBase(src, props, 2);
    return object[masks[prop].get](props[props.length - 1]);
}

function hasMask(props, masks){
    return props.length > 1 && masks[props[props.length - 2]] !== void 0;
}

function set(src, properties, value, defaults, masks){
    let obj = src;
    let props = getProps(properties);
    let i = 0;

    if(value === void 0){
        value = defaults[properties];
    }

    if(hasMask(props, masks)){
        return setMasked(obj, props, value, masks);
    }

    let {object, prop} = getBase(obj, props);
    object[prop] = value;
}

function get(src, properties, defaults, masks){
    let obj = src;
    let props = getProps(properties);
    let value;

    if(hasMask(props, masks)){
        value = getMasked(obj, props, masks);
    }else{
        let {object, prop} = getBase(obj, props);
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
    let props = Object.keys(values);
    for(let i=0; i<props.length; i++){
        set(obj, props[i], values[props[i]], defaults, masks);
    }
}

function deleteMasked(src, properties, masks){
    let {object, prop} = getBase(src, props, 2);
    return object[masks[prop].delete](props[props.length - 1]);
}

function deleteProp(src, properties, masks){
    let obj = src;
    let props = getProps(properties);
    let value;

    if(hasMask(props, masks)){
        deleteMasked(obj, props, masks);
    }else{
        let {object, prop} = getBase(obj, props);
        delete object[prop];
    }
}

function has(src, properties, defaults, masks){
    return get(src, properties, defaults, masks) !== void 0;
}

export class QuickSetter {
    constructor(object, {
        defaults = {},
        masks = {}
    } = {}){
        this.object = object;
        this.defaults = defaults;
        this.masks = masks;
    }
    set(properties, value){
        set(this.object, properties, value, this.defaults, this.masks);
    }
    get(properties){
        return get(this.object, properties, this.defaults, this.masks);
    }
    setAll(obj){
        setAll(this.object, obj, this.defaults, this.masks);
    }
    delete(properties){
        deleteProp(this, properties, masks);
    }
    has(properties){
        return has(this.object, properties, this.defaults, this.masks);
    }
}

export function q(object, options){
    return new QuickSetter(object, options);
}

export function mixinSetter(proto, {
    defaults = {},
    masks = {}
} = {}){

    if(typeof defaults !== 'object'){
        defaults = {};
    }

    Object.assign(proto, {
        set(properties, value){
            set(this, properties, value, defaults, masks);
        },
        get(properties){
            return get(this, properties, defaults, masks);
        },
        setAll(obj){
            setAll(this, obj, defaults, masks);
        },
        delete(properties){
            deleteProp(this, properties, masks);
        },
        has(properties){
            return has(this, properties, defaults, masks);
        }
    });

    return proto;
}
