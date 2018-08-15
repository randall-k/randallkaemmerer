module.exports = {
    context: __dirname + '/site/',
    entry: ['./js/main.js'],
    output: {
        path: __dirname + '/js/',
        filename: 'bundle.js'
    }
};
