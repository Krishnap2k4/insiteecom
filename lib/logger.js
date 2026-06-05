const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 }
const ACTIVE_LEVEL = LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()] ?? LEVELS.info

const shouldLog = (level) => LEVELS[level] >= ACTIVE_LEVEL

const serializeError = (err) => {
    if (!(err instanceof Error)) return err
    return {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        code: err.code,
    }
}

const emit = (level, message, context = {}) => {
    if (!shouldLog(level)) return
    const { error, ...rest } = context
    const entry = {
        ts: new Date().toISOString(),
        level,
        msg: message,
        ...rest,
        ...(error ? { error: serializeError(error) } : {}),
    }
    const line = JSON.stringify(entry)
    if (level === 'error' || level === 'warn') {
        process.stderr.write(line + '\n')
    } else {
        process.stdout.write(line + '\n')
    }
}

export const logger = {
    debug: (msg, ctx) => emit('debug', msg, ctx),
    info: (msg, ctx) => emit('info', msg, ctx),
    warn: (msg, ctx) => emit('warn', msg, ctx),
    error: (msg, ctx) => emit('error', msg, ctx),
    child: (baseContext = {}) => ({
        debug: (msg, ctx) => emit('debug', msg, { ...baseContext, ...ctx }),
        info: (msg, ctx) => emit('info', msg, { ...baseContext, ...ctx }),
        warn: (msg, ctx) => emit('warn', msg, { ...baseContext, ...ctx }),
        error: (msg, ctx) => emit('error', msg, { ...baseContext, ...ctx }),
    }),
}
