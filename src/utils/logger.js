import request from './request';

class Logger {
    constructor () {
        const ACTIVITY = {
            START_LEARNING: 'start-learning',
            END_LEARNING: 'end-learning',
        };
        Object.assign(this, ACTIVITY);
    }

    _logDefault(options) {
        return request.post('/log', {
            body: options,
        }).catch(err => console.error(err));
    }

    _logStartLearning(options) {
        return this._logDefault({
            ...options,
            activity: this.START_LEARNING,
        });
    }

    _logEndLearning(options) {
        return this._logDefault({
            ...options,
            activity: this.END_LEARNING,
        });
    }

    log (active, options) {
        switch (active) {
            case this.START_LEARNING: return this._logStartLearning(options);
            case this.END_LEARNING: return this._logEndLearning(options);

            default: return this._logDefault(options);
        }
    }
}

export default new Logger();