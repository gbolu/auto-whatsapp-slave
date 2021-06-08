class Timer{
    constructor(seconds, fn){
        this.seconds = seconds;
        this.fn = fn;
        this.timer = null;
    }

    destroy(){
        clearTimeout(this.timer);
        console.log(`Destroyed Keep Alive Timer!`);
    }

    start(){
        if(this.timer instanceof setTimeout(function(){}, 0, []).constructor){
            this.destroy();
            console.log(`Destroyed old timer! Starting new timer!`);
        }

        this.timer = setTimeout(async () => {
            await this.fn();
        }, this.seconds * 1000, [])
    }
};

module.exports = Timer;