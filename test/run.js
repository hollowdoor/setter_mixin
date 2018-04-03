const { mixinSetter } = require('../');

class MyThing {

}

mixinSetter(MyThing.prototype);

const thing = new MyThing();
thing.set('one', 1);
console.log(thing.get('one'));
