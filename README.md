setter-mixin
===

Do getting, and setting of nested objects easily.

Install
---

`npm install setter-mixin`

Usage
---

```javascript
import { mixinSetter, q } from 'setter-mixin';

class MyThing {
    constructor(){
        this.sub = {
            value: 'thing',
        };
        this.a = document.createElement('a');
        //See about masks below
        this.set('a.attr.href', window.location);
        //A dot in a property name between brackets
        this.set('[dotted.prop]', "I'm dotted");
    }
}

mixinSetter(MyThing.prototype, {
    //Masks forward get/set operations to
    //other getters, and setters.
    masks: {
        attr: {
            set: 'setAttribute',
            get: 'getAttribute',
            delete: 'removeAttribute'
        }
    },
    //When a property is undefined
    //a default can be used instead.
    defaults: {
        'sub.value2': 'value 2'
    }
});

const thing = new MyThing();
thing.set('one', 1);
console.log(thing.get('one')); //1
//Use dots to get property values from sub objects
console.log(thing.get('sub.value')); //thing
thing.set('sub.value', 'bla');
//Use brackets to get property values.
console.log(thing.get('sub[value]')); //bla
//Dots (periods) can be used in a property name
//between brackets.
console.log(thing.get('[dotted.prop]')); //I'm dotted
//A default is used here.
console.log(thing.get('sub.value2'));
//The mask for attr is used here.
console.log(thing.get('a.attr.href'));
//Sometimes you just want to get/set something.
//Use q to quickly set/get without
//modifying the object operated on.
console.log(q(thing).get('sub.value'));
//Defaults, and masks can be used
//on the quick accessor too.
console.log(q(thing, {defaults: {}, masks:{}}).get('sub.value'));
//delete a property
thing.delete('sub.value');
//When a sub object doesn't exist
//a new sub object will be created.
thing.set('some.value', 42);
console.log(thing.get('some.value')); //42
//object.has checks for undefined values
//Non-existing sub objects are still created
thing.has('some.undefined.property'); //false
```

### Auto sub-object creation

While getting/setting, and when a sub object doesn't exist a new sub object will be created using [raw-object](https://github.com/hollowdoor/raw_object). That level will use that new object.

```javascript
//The some object does not initially exist.
thing.set('some.value', 42);
//But it still works.
console.log(thing.get('some.value')); //42
```

About
---

Object composition is pretty ubiquitous. Sometimes when there is a lot of sub-objects due to composition getting, and setting properties can get messy. So we have this module here that's meant to make things a little less messy.

### Check out

* [deep-property](https://www.npmjs.com/package/deep-property)
* [deep-get-set](https://www.npmjs.com/package/deep-get-set)
* [set-value](https://www.npmjs.com/package/set-value)
* [dot-prop](https://www.npmjs.com/package/dot-prop)
* [cache-base](https://www.npmjs.com/package/cache-base)

There's a lot more modules than that. People like accessors.
