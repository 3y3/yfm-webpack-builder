let settings = null;

async function _import(module) {
    return eval(`import('${module}')`);
}

async function init() {
    const [
        assert,
        {codes},
        {types},
        {constants},
        {labelEnd},
        {markdownLineEndingOrSpace},
        {factoryWhitespace: whitespaceFactory},
        {factoryTitle: titleFactory},
        {factoryDestination: destinationFactory},
    ] = await Promise.all([
        _import('assert'),
        _import('micromark-util-symbol/codes'),
        _import('micromark-util-symbol/types'),
        _import('micromark-util-symbol/constants'),
        _import('micromark-core-commonmark'),
        _import('micromark-util-character'),
        _import('micromark-factory-whitespace'),
        _import('micromark-factory-title'),
        _import('micromark-factory-destination'),
    ]);

    return {
        micromarkExtensions: {
            text: {
                93: {
                    name: 'labelEnd',
                    tokenize: function (effects, ok, nok) {
                        return labelEnd.tokenize.call(this, effects, ok, function (code) {
                            return effects.attempt(
                                {tokenize: tokenizeResource},
                                ok,
                                nok
                            )(code)
                        });
                    },
                    resolveTo: labelEnd.resolveTo,
                    resolveAll: labelEnd.resolveAll
                }
            }
        },
        fromMarkdownExtensions: [{
            enter: {
                resourceSizeString: function () {
                    this.buffer();
                }
            },
            exit: {
                resourceSizeString: function () {
                    this.stack[this.stack.length - 1].size = this.resume()
                }
            }
        }]
    };

    function tokenizeResource(effects, ok, nok) {
        var self = this;

        const tokens = [
            {
                type: types.resourceTitle,
                marker: types.resourceTitleMarker,
                string: types.resourceTitleString
            },
            {
                type: 'resourceSize',
                marker: 'resourceSizeMarker',
                string: 'resourceSizeString'
            },
        ];

        return start;

        function start(code) {
            assert.equal(code, codes.leftParenthesis, 'expected left paren')
            effects.enter(types.resource)
            effects.enter(types.resourceMarker)
            effects.consume(code)
            effects.exit(types.resourceMarker)
            return whitespaceFactory(effects, open)
        }

        function open(code) {
            if (code === codes.rightParenthesis) {
                return end(code)
            }

            return destinationFactory(
                effects,
                destinationAfter,
                nok,
                types.resourceDestination,
                types.resourceDestinationLiteral,
                types.resourceDestinationLiteralMarker,
                types.resourceDestinationRaw,
                types.resourceDestinationString,
                constants.linkResourceDestinationBalanceMax
            )(code)
        }

        function destinationAfter(code) {
            return markdownLineEndingOrSpace(code)
                ? whitespaceFactory(effects, next)(code)
                : end(code)
        }

        function next(code) {
            const token = tokens.shift();

            if (!token) {
                return end(code)
            }

            if (
                code === codes.quotationMark ||
                code === codes.apostrophe ||
                code === codes.leftParenthesis
            ) {
                return titleFactory(
                    effects,
                    whitespaceFactory(effects, next),
                    nok,
                    token.type,
                    token.marker,
                    token.string
                )(code)
            }

            return end(code)
        }

        function end(code) {
            if (code === codes.rightParenthesis) {
                unbalance();

                effects.enter(types.resourceMarker)
                effects.consume(code)
                effects.exit(types.resourceMarker)
                effects.exit(types.resource)

                return ok
            }

            return nok(code)
        }

        function unbalance() {
            var index = self.events.length;
            var labelStart;

            // Find an opening.
            while (index--) {
                if (
                    (self.events[index][1].type === types.labelImage ||
                        self.events[index][1].type === types.labelLink) &&
                    self.events[index][1]._balanced
                ) {
                    labelStart = self.events[index][1]
                    break
                }
            }

            if (labelStart) {
                labelStart._balanced = false;
            }
        }
    }
}

export async function options() {
    if (!settings) {
        settings = await init();
    }

    return settings;
}