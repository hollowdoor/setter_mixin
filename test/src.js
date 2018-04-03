import { mixinSetter, q } from '../';

class MyThing {
    constructor(){
        this.sub = {
            value: 'thing',
        };
        this.a = document.createElement('a');
        this.set('a.attr.href', window.location);
        this['dotted.prop'] = '';
        this.set('integer', 3333);
        this.set('[dotted.prop]', "I'm dotted");
    }
}

mixinSetter(MyThing.prototype, {
    masks: {
        attr: {
            set: 'setAttribute',
            get: 'getAttribute',
            delete: 'removeAttribute'
        }
    },
    defaults: {
        'sub.value2': 'value 2'
    }
});

function onSet(obj, fn){
    let set = obj.set;
    obj.set = function(...args){
        set.apply(this, args);
        fn.apply(this, args);
    };
}

const thing = new MyThing();
onSet(thing, ()=>console.log('did set'));
thing.set('one', 1);
console.log(thing.get('one'));
console.log(thing.get('sub.value'));
thing.set('sub.value', 'bla');
console.log(thing.get('sub[value]'));
console.log(thing.get('[dotted.prop]'));
console.log(thing.get('sub.value2'))
console.log(thing.get('a.attr.href'));

console.log(q(thing).get('sub.value'));
console.log(thing.get('integer'));
thing.delete('sub.value');
console.log(thing.get('sub.value'));

thing.set('some.value', 42);
console.log(thing.get('some.value'));
