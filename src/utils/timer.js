class Timer{
    constructor(seconds, fn){
        this.seconds = seconds;
        this.fn = fn;
        this.timer = null;
    }

    destroy(message){
        clearTimeout(this.timer);
        logger.info(`${message}`);
    }

    start(){
        if(this.timer instanceof setTimeout(function(){}, 0, []).constructor){
            this.destroy(`Destroyed old timer!`);
        }

        logger.info(`Starting new Timer: ${this.seconds}s`)
        this.timer = setTimeout(async () => {
            await this.fn();
        }, this.seconds * 1000, [])
    }
};

module.exports = Timer;