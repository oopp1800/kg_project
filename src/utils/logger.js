import request from './netService/request';

const ENABLE_LOGGER = true;

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
            activity: {
                action: this.END_LEARNING,
                ...options,
            },
        });
    }

    _logEndLearning(options) {
        return this._logDefault({
            activity: {
                action: this.END_LEARNING,
                ...options,
            },
        });
    }

    log (active, options) {
        if (!ENABLE_LOGGER) {
            return Promise.resolve({
                message: 'ENABLE_LOGGER = false',
            });
        }

        switch (active) {
            case this.START_LEARNING: return this._logStartLearning(options);
            case this.END_LEARNING: return this._logEndLearning(options);

            default: return this._logDefault(options);
        }
    }
}

export default new Logger();