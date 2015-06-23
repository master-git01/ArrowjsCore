'use strict';

let mailer = require('nodemailer');

/**
 * Create breadcrumb
 * @param {array} root - Base breadcrumb
 * @returns {array} - Return new breadcrumb
 */
exports.createBreadcrumb = function (root) {
    let arr = root.slice(0);
    for (let i = 1; i < arguments.length; i++) {
        if (arguments[i] != undefined)
            arr.push(arguments[i]);
    }
    return arr;
};

/**
 * Add active class to current menu
 * @param {string} value - Menu link
 * @param {string} string_to_compare - String to compare with menu link
 * @param {string} css_class - CSS class when not use class "active"
 * @param {integer} index
 * @returns {string}
 */
exports.active_menu = function (value, string_to_compare, css_class, index) {
    let arr = value.split('/');
    let st = "active";

    if (css_class) {
        st = css_class;
    }

    if (string_to_compare == '') {
        string_to_compare = 'index';
    }

    if (~string_to_compare.indexOf('/')) {
        string_to_compare = string_to_compare.split('/')[index];
    }

    if (index) {
        let v = arr[index];
        if (!v) {
            v = "index";
        }
        return v === string_to_compare ? st : "";
    }

    return arr[2] == string_to_compare ? st : "";
};

/**
 * Sort menu by "sort" property
 * @param {object} menus
 * @returns {array}
 */
exports.sortMenus = function (menus) {
    let sortable = [];

    // Add menus to array
    for (let m in menus) {
        if (menus.hasOwnProperty(m)) {
            sortable.push({menu: m, sort: menus[m].sort});
        }
    }

    // Sort menu array
    sortable.sort(function (a, b) {
        if (a.sort < b.sort)
            return -1;
        if (a.sort > b.sort)
            return 1;
        return 0;
    });

    return sortable;
};

/**
 * Get widget by alias
 * @param {string} alias
 * @returns {object}
 */
exports.getWidget = function (alias) {
    for (let i in __widgets) {
        if (__widgets.hasOwnProperty(i)) {
            if (__widgets[i].config && __widgets[i].config.alias == alias) {
                return __widgets[i];
            }
        }
    }
};

/**
 * Create Environment to handles templates
 * @param {array} views - List of loaders
 * @returns {object}
 */
exports.createNewEnv = function (views) {
    let nunjucks = require('nunjucks');
    let env;

    if (views) {
        env = new nunjucks.Environment(new nunjucks.FileSystemLoader(views));
    } else {
        env = new nunjucks.Environment(new nunjucks.FileSystemLoader([__base + 'core/widgets', __base + 'app/widgets', __base + 'themes/frontend']));
    }

    env = __.getAllCustomFilter(env);
    env = __.getAllGlobalVariable(env);

    return env;
};

/**
 * Add custom filter to Environment
 * @param {object} env - Environment to add custom filter
 * @returns {object}
 */
exports.getAllCustomFilter = function (env) {
    let custom_filters = __config.getOverrideCorePath(__base + 'core/custom_filters/*.js', __base + 'app/custom_filters/*.js', 1);

    for (let index in custom_filters) {
        if (custom_filters.hasOwnProperty(index)) {
            require(custom_filters[index])(env);
        }
    }

    return env;
};

/**
 * Add global variables to Environment
 * @param {object} env - Environment to add global variable
 * @returns {object}
 */
//todo: hoi anh thanh
exports.getAllGlobalVariable = function (env) {
    env.addGlobal('create_link', function (module_name, link) {
        return module_name + '/' + link;
    });
    return env;
};

/**
 * Parse query conditions with column type
 * @param {string} column_name
 * @param {string} value
 * @param {string} col
 * @returns {string}
 */
exports.parseCondition = function (column_name, value, col) {
    if (col.filter.filter_key) {
        column_name = col.filter.filter_key;
    }

    column_name = (col.filter.model ? (col.filter.model + '.') : '') + column_name;
    column_name = column_name.replace(/(.*)\.(.*)/, '"$1"."$2"');

    if (col.filter.data_type == 'array') {
        return column_name + ' @> ?';
    } else if (col.filter.data_type == 'string') {
        return column_name + ' ilike ?';
    } else if (col.filter.data_type == 'datetime') {
        return column_name + " between ?::timestamp and ?::timestamp";
    } else {
        if (~value.indexOf('><') || col.filter.type == 'datetime') {
            return column_name + " between ? and ?";
        } else if (~value.indexOf('<>')) {
            return column_name + " not between ? and ?";
        } else if (~value.indexOf('>=')) {
            return column_name + " >= ?";
        } else if (~value.indexOf('<=')) {
            return column_name + " <= ?";
        } else if (~value.indexOf('<')) {
            return column_name + " < ?";
        } else if (~value.indexOf('>')) {
            return column_name + " > ?";
        } else if (~value.indexOf(';')) {
            return column_name + " in (?)";
        } else {
            return column_name + " = ?";
        }
    }
};

/**
 * Parse value with data type
 * @param {string} value
 * @param {object} col
 * @returns {string}
 */
exports.parseValue = function (value, col) {
    if (col.filter.data_type == 'array') {
        return '{' + value + '}';
    }

    if (col.filter.data_type == 'datetime') {
        return value.split(/\s+-\s+/);
    } else if (col.filter.data_type == 'string') {
        value = "%" + value + "%";
    } else if (col.filter.data_type == 'bytes') {
        let match = /([0-9]+)\s*(.*)/g.exec(value);

        if (match) {
            let unit = match[2];
            value = match[1];

            switch (unit.toLowerCase()) {
                case "kb":
                    value = value * 1000;
                    break;
                case 'mb':
                    value = value * 1000 * 1000;
                    break;
                case "gb":
                    value = value * 1000 * 1000 * 1000;
                    break;
            }
            return value;
        }
    }

    if (~value.indexOf('><')) {
        return value.split('><');
    } else if (~value.indexOf('<>')) {
        return value.split('<>');
    } else {
        return value.replace(/[><]/g, "");
    }
};

/**
 * Create filter column for standard table
 * @param {object} req - Request
 * @param {object} res - Response
 * @param {route} route - Module name
 * @param {string} reset_link - Link to create button reset filter
 * @param {string} current_column - Current column used to sorting
 * @param {string} current_order - Current "order by" used to sorting
 * @param {string} columns - List of columns which display in table
 * @param {string} customCondition - Custom conditions
 * @returns {object}
 */
exports.createFilter = function (req, res, route, reset_link, current_column, current_order, columns, customCondition) {
    // Add button Search
    if (route != '') {
        res.locals.searchButton = __acl.customButton(route);
        res.locals.resetFilterButton = __acl.customButton(reset_link);
    }

    let conditions = [];
    let values = [];
    let attributes = [];
    values.push('');

    // Get column by name
    let getColumn = function (name) {
        for (let i in columns) {
            if (columns.hasOwnProperty(i) && columns[i].column == name) {
                return columns[i];
            }
        }
        return {filter: {}};
    };

    // Get values
    for (let i in req.query) {
        if (req.query.hasOwnProperty(i) && req.query[i] != '') {
            let col = getColumn(i);
            if (!col) continue;

            if (col.query) {
                conditions.push(col.query);
            } else {
                conditions.push(__.parseCondition(i, req.query[i], col));
            }

            let value = __.parseValue(req.query[i], col);
            if (Array.isArray(value)) {
                for (let y in value) {
                    values.push(value[y].trim());
                }

            } else {
                values.push(value);
            }
        }
    }

    // Get attributes
    for (let i in columns) {
        if (columns.hasOwnProperty(i) && columns[i].column != '')
            attributes.push(columns[i].column);
    }

    let tmp = conditions.length > 0 ? "(" + conditions.join(" AND ") + ")" : " 1=1 ";
    values[0] = tmp + (customCondition ? customCondition : '');

    // Set local variables
    res.locals.table_columns = columns;
    res.locals.currentColumn = current_column;
    res.locals.currentOrder = current_order;
    res.locals.filters = req.query;

    // Wrap column name by double quotes to prevent error when query
    if (current_column.indexOf('.') > -1)
        current_column = current_column.replace(/(.*)\.(.*)/, '"$1"."$2"');

    return {
        values: values,
        attributes: attributes,
        sort: current_column + " " + current_order
    };
};

/**
 * Convert filter values to String (use in raw query)
 * @param {array} filterValues - Values of filter which created by createFilter
 * @returns {string}
 */
exports.toRawFilter = function (filterValues) {
    let conditions = filterValues[0].split('?');
    for (let i = 0; i < conditions.length - 1; i++) conditions[i] += "'" + filterValues[i + 1] + "'";
    return conditions.join('');
};

/**
 * Generate random string from possible string
 * @param {integer} length - Length of random string
 * @returns {string}
 */
exports.randomSalt = function (length) {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};

/**
 * Send mail with provided options
 * @param {object} mailOptions
 * @returns {Promise}
 */
exports.sendMail = function (mailOptions) {
    return new Promise(function (fulfill, reject) {
        let transporter = mailer.createTransport(__config.mailer_config);
        transporter.sendMail(mailOptions, function (err, info) {
            if (err !== null) {
                reject(err);
            } else {
                fulfill(info);
            }
        });
    });
};
