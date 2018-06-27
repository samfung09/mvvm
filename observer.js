function observe(data){
    if(!data || typeof data !== 'object'){      //如果没有数据或者数据不是对象则不用递归
        return;
    }
    Object.keys(data).forEach(function(key){
        hijackData(data, key, data[key]);
    })
}

//数据劫持
function hijackData(data, key, val){    
    var dep = new Dep();    //管理订阅者
    observe(data[key]);     //递归观察嵌套对象
    Object.defineProperty(data, key, {
        configurable: false,
        enumerable: true,
        get: function(){
            Dep.target && dep.addSub(Dep.target);//如果Dep.target有值则证明当前是订阅者在取值，这时添加订阅者            
            return val;
        },
        set: function(value){
            val = value;        //这里value不能直接赋值给data[key]，否则会报错
            dep.notify();       //当值改变时通知订阅者
        }
    })
}

//依赖(管理订阅者)
function Dep() {
    this.subs = [];
}
Dep.prototype = {
    addSub: function(sub) {
        this.subs.push(sub);
    },
    notify: function() {
        this.subs.forEach(function(sub) {
            sub.update();
        });
    }
};