

const statusCode = {
    '200': {
        success: true,
        message: 'Successfull'
    },
    '401': {
        success: false,
        message: 'User not authenticated'
    },
    '400': {
        success: false,
        message: 'bad Request'
    },
    '402': {
        success: false,
        message: 'Bad Request',
        redirectUrl: '/'
    },
    '403': {
        success: false,
        message: 'Forbidden'
    },
    '404': {
        success: false,
        message: 'Page not found'
    },
    '409': {
        success: false,
        message: 'Duplicate found'
    },
    '500': {
        success: false,
        message: 'Internal server error. Please try again later..',
        redirectUrl: '/pageNotFound'
    },
};

function handleStatus(res, code, customMessage, options = {}) {

    const status = { ...statusCode[code] };

    const response = {
        success: status.success,
        message: typeof customMessage === 'string' ? customMessage : status.message,
        ...options
    };

    if (typeof customMessage === 'object' && customMessage !== null) {
        Object.assign(response, customMessage);
    };

    if (code !== 200 && (options.redirectUrl || status.redirectUrl)) {
        return res.status(code).redirect(options.redirectUrl || status.redirectUrl);
    }

    return res.status(code).json(response);
};


module.exports = {
    handleStatus
}