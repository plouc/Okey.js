/**
 * Okey validator class.
 *
 * sample usage:
 *
 *   var validator = new Okey({
 *     required: {},
 *     integer: {}
 *   });
 *   validator.validate('Test');
 *   console.log(validator.hasError());
 *   console.log(validator.errors);
 *   console.log(validator.value);
 *
 * @author Raphaël Benitte
 * @since  2012-06-11
 */

/**
 * @param {Object} validatorsConfig
 * @constructor
 */
var Okey = function(validatorsConfig) {

    this.value = null;

    /** @type {boolean} */
    this.errors = [];

    /** @type {boolean} */
    this.hasError = false;

    /*
     * break filter chain when one validate function fail,
     * for example, if you have two validators, 'required' and 'integer',
     * if 'required' fail, 'integer' won't be executed if breakOnError === true,
     * otherwise, it will be executed.
     *
     * @type {boolean}
     */
    this.breakOnError = true;

    /** @type {Array} */
    this.validators = [];

    for (var validatorAlias in validatorsConfig) {
        if (validatorsConfig.hasOwnProperty(validatorAlias)) {

            if (!Okey.validators.hasOwnProperty(validatorAlias)) {
                throw 'Unknown validator type "' + validatorAlias + '"';
            }

            var validatorConfig = validatorsConfig[validatorAlias],
                validator = Okey.validators[validatorAlias];

            // copy validator to break reference to validator template
            this.validators.push({
                alias: validator.alias,
                options: this.validateOptions(validator.options, validatorConfig, validatorAlias),
                processor: validator.processor
            });
        }
    }
};

/**
 * @param {Object} config
 * @param {Object} options
 * @param {string} alias
 * @return {Object}
 */
Okey.prototype.validateOptions = function(config, options, alias) {
    if (options !== null && typeof options === 'object') {
        for (var optionKey in config) {
            if (config.hasOwnProperty(optionKey) && config[optionKey] === true) {
                if (!options.hasOwnProperty(optionKey) || options[optionKey] === null) {
                    throw '"' + optionKey + '" option is required in order to run "' + alias + '" validator';
                }
            }
        }
    }
    return options;
};

/**
 * @param {string} validatorAlias
 * @return {?Object}
 */
Okey.prototype.getSubValidator = function(validatorAlias) {

    var l = this.validators.length;
    for (var  i = 0; i < l; i++) {
          var validator = this.validators[i];
          if (validator.alias === validatorAlias) {
              return validator;
          }
    }

    return null;
};

/**
 * Validate value passing it to each validators.
 *
 * @param {*} value
 * @return {*}
 */
Okey.prototype.validate = function(value) {

    // reset errors
    this.errors = [];
    this.hasError = false;

    // set the current value
    this.value = value;

    // loop on each validators
    var l = this.validators.length;
    for (var  i = 0; i < l; i++) {
        var validator = this.validators[i];
        try {
            validator.processor.apply(this, [validator.options]);
        } catch (errorMessage) {

            this.errors.push(errorMessage);
            this.hasError = true;

            // break filter chain
            if (this.breakOnError === true) {
                break;
            }
        }
    }

    return this.value;
};

/**
 * Okey error messages.
 *
 * @type {Object.<string>}
 */
Okey.errorMessages = {
    required: 'error_message_required',
    notNumber: 'error_message_%value%_is_not_a_number',
    notInt: 'error_message_%value%_is_not_an_integer',
    outOfRange: 'error_message_%value%_is_out_of_range_%start%_%end%',
    minLength: 'error_message_%value%_length_is_not_greater_than_%min_length%'
};

/**
 * Okey validators, exposed for performance reason.
 *
 * @type {Object.<Object>}
 */
Okey.validators = {

    /**
     * Checks the field is not null nor an empty string.
     */
    required: {
        alias: 'required',
        options: {},
        processor: function () {
            if (this.value === null || this.value === '') {
                throw Okey.errorMessages['required'];
            }
        }
    },

    /**
     * Validates value length.
     */
    minLength: {
        alias: 'minLength',
        options: {
          minLength: true
        },
        processor: function(options) {
            if (!this.value.hasOwnProperty('length') || !this.value.length < options.minLength) {
                throw Okey.errorMessages['minLength']
                    .replace('%value%', this.value)
                    .replace('%min_length%', options.minLength);
            }
        }
    },

    /**
     * Checks if value is a number using a regex.
     */
    isNumber: {
        alias: 'isNumber',
        options: {},
        processor: function() {
            if (!this.value.toString().match(/^[-]?d*.?d*$/)) {
                throw Okey.errorMessages['notNumber']
                    .replace('%value%', this.value);
            }
            this.value = parseFloat(this.value);
        }
    },

    /**
     * Checks if value is an integer.
     */
    integer: {
        alias: 'integer',
        options: {},
        processor: function () {
            if ((parseFloat(this.value) != parseInt(this.value)) || isNaN(this.value)) {
              throw Okey.errorMessages['notInt']
                  .replace('%value%', this.value);
            }
            this.value = parseInt(this.value);
        }
    },

    /**
     * Checks that value sit between start and end value (inclusive).
     */
    range: {
        alias: 'range',
        options: {
            start: true,
            end: true
        },
        processor: function(options) {
            if (this.value < options.start || this.value > options.end) {
                throw Okey.errorMessages['outOfRange']
                    .replace('%value%', this.value)
                    .replace('%start%', options.start)
                    .replace('%end%', options.end);
            }
            this.value = parseFloat(this.value);
        }
    }
};