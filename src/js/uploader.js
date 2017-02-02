'use strict';

var consts = require('./consts');
var utils = require('./utils');
var Form = require('./view/form');
var List = require('./view/list');
var DragAndDrop = require('./view/drag');
var OldRequester = require('./requester/old');
var ModernRequester = require('./requester/modern');

var REQUESTER_TYPE_MODERN = consts.CONF.REQUESTER_TYPE_MODERN;
var classNames = consts.CLASSNAME;

/**
 * @constructor
 * @param {object} options To set up uploader modules.
 *  @param {object} options.url File server urls.
 *      @param {string} options.url.send Send url.
 *      @param {string} options.url.remove Delete url.
 *  @param {string} [options.formTarget='tuiUploaderHiddenFrame'] The target name(iframe) for CORS.
 *  @param {object} options.listInfo To display files information.
 *  @param {boolean} options.useFolder Use directory upload. If ture, 'isMultiple' option will be ignored.
 *  @param {boolean} options.isMultiple Use multiple files upload.
 * @param {jQuery} $el Root Element of Uploader
 * @example
 * // HTML
 * //  <div id="uploader"></div>
 * //  <div id="list">
 * //    <div class="count">count : <strong id="file_count"></strong></div>
 * //    <div class="size">size : <strong id="size_count"></strong></div>
 * //    <ul id="files"></ul>
 * //  </div>
 *
 * var uploader = new tui.component.Uploader({
 *     url: {
 *         send: "http://fe.nhnent.com/etc/etc/uploader/uploader.php",
 *         remove: "http://fe.nhnent.com/etc/etc/uploader/remove.php"
 *     },
 *     listInfo: {
 *         list: $('#files'),
 *         count: $('#file_count'),
 *         size: $('#size_count')
 *     }
 * }, $('#uploader'));
 */
var Uploader = tui.util.defineClass(/**@lends Uploader.prototype */{
    init: function($el, options) {
        /**
         * Uploader element
         * @type {jQuery}
         * @private
         */
        this.$el = $el;

        /**
         * Send/Remove url
         * @type {{send: string, remove: string}}
         * @private
         */
        this.url = options.url;

        /**
         * Redirect URL for CORS(response, IE7)
         * @private
         * @type {string}
         */
        this.redirectURL = options.redirectURL;

        /**
         * Form target name for CORS (IE7, 8, 9)
         * @private
         * @type {string}
         */
        this.formTarget = consts.CONF.FORM_TARGET_NAME;

        /**
         * Target frame for CORS (IE7, 8, 9)
         * @private
         * @type {jQuery}
         */
        this.$targetFrame = this._createTargetFrame()
            .appendTo(this.$el);

        /**
         * Whether the uploader uses batch-transfer
         * @private
         * @type {boolean}
         */
        this.isBatchTransfer = !!(options.isBatchTransfer);

        /**
         * Whether the sending/removing urls are x-domain.
         * @private
         * @type {boolean}
         */
        this.isCrossDomain = utils.isCrossDomain(this.url.send);

        /**
         * Whether the browser supports PostMessage API
         * @private
         * @type {boolean}
         */
        this.isSupportPostMessage = !!(tui.util.pick(this.$targetFrame, '0', 'contentWindow', 'postMessage'));

        /**
         * Whether the user uses multiple upload
         * @private
         * @type {boolean}
         */
        this.isMultiple = !!(options.isMultiple);

        /**
         * Whether the user uses drag&drop upload
         * @private
         * @type {boolean}
         */
        this.useDrag = !!(options.useDrag);

        /**
         * Whether the user uses folder upload
         * @private
         * @type {boolean}
         */
        this.useFolder = !!(options.useFolder);

        /**
         * From View
         * @private
         * @type {Form}
         */
        this.formView = new Form(this);

        /**
         * List View
         * @private
         * @type {List}
         */
        this.listView = new List(options.listUI, this.$el.find('.' + classNames.LIST_CONTAINER));

        if (this.useDrag && !this.useFolder && utils.isSupportFileSystem()) {
            /**
             * Drag & Drop View
             * @private
             * @type {DragAndDrop}
             */
            this.dragView = new DragAndDrop(this.$el.find('.' + classNames.DROPZONE));
        }

        this._setRequester();
        this._addEvent();

        if (this.isCrossDomain && this.isSupportPostMessage) {
            this._setPostMessageEvent();
        }
    },

    /**
     * Set Connector
     * @private
     */
    _setRequester: function() {
        if (utils.isSupportFormData()) {
            this._requester = new ModernRequester(this);
        } else {
            this._requester = new OldRequester(this);
        }
    },

    /**
     * Set post-message event if supported and needed
     * @private
     */
    _setPostMessageEvent: function() {
        this.$targetFrame.off('load');
        $(window).on('message', $.proxy(function(event) {
            var originalEvent = event.originalEvent,
                data;

            if (this.url.send.indexOf(originalEvent.origin) === -1) {
                return;
            }
            data = $.parseJSON(originalEvent.data);

            if (this.isBatchTransfer) {
                this.clear();
            } else {
                this.updateList(data.filelist);
            }
            this.fire('success', data);
        }, this));
    },

    /**
     * Make target frame to be target of form element.
     * @returns {jQuery} Target frame: jquery-element
     * @private
     */
    _createTargetFrame: function() {
        var $target = $('<iframe name="' + this.formTarget + '"></iframe>');
        $target.css({
            visibility: 'hidden',
            position: 'absolute'
        });

        return $target;
    },

    /**
     * Add events to views and fire uploader events
     * @private
     */
    _addEvent: function() {
        this.listView.on('remove', this.removeFile, this);
        this.listView.on('check', function(data) {
            /**
             * Check event
             * @event Uploader#check
             * @param {object} evt - Event object
             *  @param {string} evt.id - File id
             *  @param {string} evt.name - File name
             *  @param {string} evt.size - File size
             *  @param {boolean} evt.isChecked - Checked state
             */
            this.fire('check', data);
        }, this);
        if (this.isBatchTransfer) {
            this._addEventWhenBatchTransfer();
        } else {
            this._addEventWhenNormalTransfer();
        }
    },

    /**
     * Add event when uploader uses batch-transfer
     * @private
     */
    _addEventWhenBatchTransfer: function() {
        this.formView.on({
            change: this.store,
            submit: this.submit
        }, this);

        this._requester.on({
            removed: function(data) {
                this.updateList(data.filelist, 'remove');
                this.fire('remove', data);
            },
            error: function(data) {
                this.fire('error', data);
            },
            uploaded: function(data) {
                this.clear();
                this.fire('success', data);
            },
            stored: function(data) {
                this.updateList(data);
                this.fire('update', data);
            }
        }, this);

        if (this.useDrag && this.dragView) {
            this.dragView.on('drop', this.store, this);
        }
    },

    /**
     * Add event when uploader uses normal-transfer
     * @private
     */
    _addEventWhenNormalTransfer: function() {
        this.formView.on('change', this.sendFile, this);

        this._requester.on({
            removed: function(data) {
                this.updateList(data.filelist, 'remove');
                this.fire('remove', data);
            },
            error: function(data) {
                this.fire('error', data);
            },
            uploaded: function(data) {
                this.updateList(data.filelist);
                this.fire('success', data);
            }
        }, this);

        if (this.useDrag && this.dragView) {
            this.dragView.on('drop', function(files) {
                this.store(files);
                this.submit();
            }, this);
        }
    },

    /**
     * Update list view with custom or original data.
     * @param {object} info - The data for update list
     * @param {*} type - Update type
     * @private
     */
    updateList: function(info, type) {
        this.listView.update(info, type);
    },

    /**
     * Callback for custom send event
     * @param {Event} [event] - Form submit event
     * @private
     */
    sendFile: function(event) {
        this.store();
        this.submit(event);
    },

    /**
     * Callback for custom remove event
     * @param {object} data The data for remove file.
     * @private
     */
    removeFile: function(data) {
        this._requester.remove(data);
    },

    /**
     * Submit for data submit to server
     * @param {Event} [event] - Form submit event
     */
    submit: function(event) {
        if (event && this._requester.TYPE === REQUESTER_TYPE_MODERN) {
            event.preventDefault();
        }
        this._requester.upload();
    },

    /**
     * Clear uploader
     */
    clear: function() {
        this._requester.clear();
        this.formView.clear();
        this.listView.clear();
    },

    /**
     * Store input element to pool.
     * @param {Array.<File> | File} [files] - A file or files
     * @private
     */
    store: function(files) {
        this._requester.store(files);
    },

    /**
     * Remove checked file list
     * @param {Array.<number>} indexList - Index list
     */
    removeCheckedList: function(indexList) {
        var listView = this.listView;
        var chekcedIndexList = indexList || listView.checkedIndexList;
        var files = listView.items;
        var checkedFiles = [];
        var file;

        tui.util.forEach(chekcedIndexList, function(index) {
            file = files[index];

            checkedFiles.push({
                id: file.id,
                name: file.name
            });
        }, this);

        if (checkedFiles.length) {
            this.removeFile({filelist: checkedFiles});
        }
    },

    /**
     * Get uploaded file's total count
     * @returns {number} Total count
     */
    getUploadedTotalCount: function() {
        return this.listView.items.length;
    },

    /**
     * Get uploaded file's total size
     * @returns {string} Total size with unit
     */
    getUploadedTotalSize: function() {
        var items = this.listView.items;
        var totalSize = 0;

        tui.util.forEach(items, function(item) {
            totalSize += parseFloat(item.size);
        });

        return utils.getFileSizeWithUnit(totalSize);
    },

    /**
     * Get checked file's total count
     * @returns {number} Total count
     */
    getCheckedTotalCount: function() {
        return this.listView.checkedIndexList.length;
    },

    /**
     * Get checked file's total size
     * @returns {string} Total size with unit
     */
    getCheckedTotalSize: function() {
        var listView = this.listView;
        var checkedItemsIndex = listView.checkedIndexList;
        var totalSize = 0;
        var item;

        tui.util.forEach(checkedItemsIndex, function(index) {
            item = listView.items[index];
            totalSize += parseFloat(item.size);
        });

        return utils.getFileSizeWithUnit(totalSize);
    }
});

tui.util.CustomEvents.mixin(Uploader);
module.exports = Uploader;

/**
 * Remove event
 * @event Uploader#remove
 * @param {object} data - Remove data from this component
 *  @param {string} data.message - 'success' or 'fail'
 *  @param {string} data.name - file name
 *  @param {string} data.id - file id
 */

/**
 * Error event
 * @event Uploader#error
 * @param {Error} data - Error data
 *  @param {string} data.status - Error status
 *  @param {string} data.message - Error message
 */

/**
 * Success event
 * @event Uploader#success
 * @param {object} data - Server response data
 *  @param {Array} data.filelist - Uploaded file list
 *  @param {number} [data.success] - Uploaded file count
 *  @param {number} [data.failed] - Failed file count
 *  @param {number} [data.count] - Total count
 */

/**
 * Update event
 * @event Uploader#update
 * @param {Array.<object>} data - File list data
 * Array having objects<br>{id: string, name: string, size: number}
 */
