// Expected: If any template elements do not exists, fail silently (no unchecked errors, etc)
qq.Templating = function(spec) {
    "use strict";

    var api, isEditElementsExist, isRetryElementExist,
        fileIdAttr = "qq-file-id",
        fileClassPrefix = "qq-file-id-",
        isCancelDisabled = false,
        options = {
            templateIdOrEl: "qq-template",
            containerEl: null,
            fileContainerEl: null,
            button: null,
            disableDnd: false,
            classes: {
                hide: "qq-hide",
                editable: "qq-editable"
            }
        },
        selectorClasses = {
            button: 'qq-upload-button-selector',
            drop: 'qq-upload-drop-area-selector',
            list: 'qq-upload-list-selector',
            progressBarContainer: "qq-progress-bar-container-selector",
            progressBar: 'qq-progress-bar-selector',
            file: 'qq-upload-file-selector',
            spinner: 'qq-upload-spinner-selector',
            size: 'qq-upload-size-selector',
            cancel: 'qq-upload-cancel-selector',
            deleteButton: 'qq-upload-delete-selector',
            retry: 'qq-upload-retry-selector',
            statusText: 'qq-upload-status-text-selector',
            editFilenameInput: 'qq-edit-filename-selector',
            editNameIcon: 'qq-edit-filename-icon-selector',
            dropProcessing: 'qq-drop-processing-selector',
            dropProcessingSpinner: 'qq-drop-processing-spinner-selector'
        },
        templateHtml, container, fileList;

    qq.extend(options, spec);
    container = options.containerEl;


    function getTemplateHtml() {
        var scriptEl, scriptHtml, fileListNode, tempTemplateEl, fileListHtml, defaultButton, dropzone;

        if (options.templateIdOrEl == null) {
            throw new Error("You MUST specify either a template element or ID!");
        }

        if (qq.isString(options.templateIdOrEl)) {
            scriptEl = document.getElementById(options.templateIdOrEl);

            if (scriptEl === null) {
                throw new Error(qq.format("Cannot find template script at ID '{}'!", options.templateIdOrEl));
            }

            scriptHtml = scriptEl.innerHTML;
        }
        else {
            if (options.templateIdOrEl.innerHTML === undefined) {
                throw new Error("You have specified an invalid value for the template option!  " +
                    "It must be an ID or an Element.");
            }

            scriptHtml = options.templateIdOrEl.innerHTML;
        }

        scriptHtml = qq.trimStr(scriptHtml);
        tempTemplateEl = document.createElement("div");
        tempTemplateEl.appendChild(qq.toElement(scriptHtml));

        if (spec.button) {
            defaultButton = qq(tempTemplateEl).getByClass(selectorClasses.button)[0];
            if (defaultButton) {
                qq(defaultButton).remove();
            }
        }

        if (spec.disableDnd) {
            dropzone = qq(tempTemplateEl).getByClass(selectorClasses.drop)[0];
            if (dropzone) {
                qq(dropzone).remove();
            }
        }

        isEditElementsExist = qq(tempTemplateEl).getByClass(selectorClasses.editFilenameInput).length > 0;
        isRetryElementExist = qq(tempTemplateEl).getByClass(selectorClasses.retry).length > 0;

        fileListNode = qq(tempTemplateEl).getByClass(selectorClasses.list)[0];
        fileListHtml = fileListNode.innerHTML;
        fileListNode.innerHTML = "";

        return {
            template: qq.trimStr(tempTemplateEl.innerHTML),
            fileTemplate: qq.trimStr(fileListHtml)
        }
    }

    function getFile(id) {
        return qq(fileList).getByClass(fileClassPrefix + id)[0];
    }

    function getTemplateEl(context, cssClass) {
        return qq(context).getByClass(cssClass)[0];
    }

    function prependFile(el, index) {
        var parentEl = fileList,
            beforeEl = parentEl.firstChild;

        if (index > 0) {
            beforeEl = qq(parentEl).children()[index].nextSibling;

        }

        parentEl.insertBefore(el, beforeEl);
    }

    function getCancel(id) {
        return getTemplateEl(getFile(id), selectorClasses.cancel);
    }

    function getProgress(id) {
        return getTemplateEl(getFile(id), selectorClasses.progressBarContainer) ||
            getTemplateEl(getFile(id), selectorClasses.progressBar);
    }

    function getSpinner(id) {
        return getTemplateEl(getFile(id), selectorClasses.spinner);
    }

    function getEditIcon(id) {
        return getTemplateEl(getFile(id), selectorClasses.editNameIcon);
    }

    function getSize(id) {
        return getTemplateEl(getFile(id), selectorClasses.size);
    }

    function getDelete(id) {
        return getTemplateEl(getFile(id), selectorClasses.deleteButton);
    }

    function getRetry(id) {
        return getTemplateEl(getFile(id), selectorClasses.retry);
    }

    function getFilename(id) {
        return getTemplateEl(getFile(id), selectorClasses.file);
    }

    function getDropProcessing() {
        return getTemplateEl(container, selectorClasses.dropProcessing);
    }

    function hide(el) {
        el && qq(el).addClass(spec.classes.hide);
    }

    function show(el) {
        el && qq(el).removeClass(spec.classes.hide);
    }

    function setProgressBarWidth(id, percent) {
        var bar = getProgress(id);

        if (bar && !qq(bar).hasClass(selectorClasses.progressBar)) {
            bar = qq(bar).getByClass(selectorClasses.progressBar)[0];
        }

        qq(bar).css({width: percent + '%'});
    }

    templateHtml = getTemplateHtml();

    api = {
        render: function() {
            container.innerHTML = templateHtml.template;
            hide(getDropProcessing());
            fileList = options.fileContainerEl || getTemplateEl(container, selectorClasses.list)
        },

        renderFailure: function(message) {
            var cantRenderEl = qq.toElement(message);
            container.innerHTML = "";
            container.appendChild(cantRenderEl);
        },

        reset: function() {
            api.render();
        },

        clearFiles: function() {
            fileList.innerHTML = "";
        },

        disableCancel: function() {
            isCancelDisabled = true;
        },

        addFile: function(id, name, prependInfo) {
            var fileEl = qq.toElement(templateHtml.fileTemplate),
                fileNameEl = getTemplateEl(fileEl, selectorClasses.file);

            qq(fileEl).addClass(fileClassPrefix + id);
            fileNameEl && qq(fileNameEl).setText(name);
            fileEl.setAttribute(fileIdAttr, id);

            if (prependInfo) {
                prependFile(fileEl, prependInfo.index);
            }
            else {
                fileList.appendChild(fileEl);
            }

            hide(getProgress(id));
            hide(getSize(id));
            hide(getDelete(id));
            hide(getRetry(id));

            if (isCancelDisabled) {
                api.hideCancel(id);
            }
        },

        removeFile: function(id) {
            qq(getFile(id)).remove();
        },

        getFileId: function(el) {
            var currentNode = el;

            while (currentNode.getAttribute(fileIdAttr) == null) {
                currentNode = el.parentNode;
            }

            return currentNode.getAttribute(fileIdAttr);
        },

        getFileList: function() {
            return fileList;
        },

        markFilenameEditable: function(id) {
            var filename = getFilename(id);

            filename && qq(filename).addClass(spec.classes.editable);
        },

        updateFilename: function(id, name) {
            var filename = getFilename(id);

            filename && qq(filename).setText(name);
        },

        hideFilename: function(id) {
            hide(getFilename(id));
        },

        showFilename: function(id) {
            show(getFilename(id));
        },

        isFileName: function(el) {
            return qq(el).hasClass(selectorClasses.file);
        },

        getButton: function() {
            return options.button || getTemplateEl(container, selectorClasses.button);
        },

        hideDropProcessing: function() {
            hide(getDropProcessing());
        },

        showDropProcessing: function() {
            show(getDropProcessing());
        },

        getDropZone: function() {
            return getTemplateEl(container, selectorClasses.drop);
        },

        isEditFilenamePossible: function() {
            return isEditElementsExist;
        },

        isRetryPossible: function() {
            return isRetryElementExist;
        },

        getFileContainer: function(id) {
            return getFile(id);
        },

        showEditIcon: function(id) {
            var icon = getEditIcon(id);

            icon && qq(icon).addClass(spec.classes.editable);
        },

        hideEditIcon: function(id) {
            var icon = getEditIcon(id);

            icon && qq(icon).removeClass(spec.classes.editable);
        },

        isEditIcon: function(el) {
            return qq(el).hasClass(selectorClasses.editNameIcon);
        },

        getEditInput: function(id) {
            return getTemplateEl(getFile(id), selectorClasses.editFilenameInput);
        },

        isEditInput: function(el) {
            return qq(el).hasClass(selectorClasses.editFilenameInput);
        },

        updateProgress: function(id, loaded, total) {
            var bar = getProgress(id),
                percent;

            if (bar) {
                percent = Math.round(loaded / total * 100);

                if (loaded === total) {
                    hide(bar);
                }
                else {
                    show(bar);
                }

                setProgressBarWidth(id, percent);
            }
        },

        hideProgress: function(id) {
            var bar = getProgress(id);

            bar && hide(bar);
        },

        resetProgress: function(id) {
            setProgressBarWidth(id, 0);
        },

        showCancel: function(id) {
            if (!isCancelDisabled) {
                var cancel = getCancel(id);

                cancel && qq(cancel).removeClass(spec.classes.hide);
            }
        },

        hideCancel: function(id) {
            hide(getCancel(id));
        },

        isCancel: function(el)  {
            return qq(el).hasClass(selectorClasses.cancel);
        },

        showDelete: function(id) {
            show(getDelete(id));
        },

        hideDelete: function(id) {
            hide(getDelete(id));
        },

        isDelete: function(el) {
            return qq(el).hasClass(selectorClasses.deleteButton);
        },

        isRetry: function(el) {
            return qq(el).hasClass(selectorClasses.retry);
        },

        updateSize: function(id, text) {
            var size = getSize(id);

            if (size) {
                show(size);
                qq(size).setText(text);
            }
        },

        setStatusText: function(id, text) {
            var textEl = getTemplateEl(getFile(id), selectorClasses.statusText);

            if (textEl) {
                if (text == null) {
                    qq(textEl).clearText();
                }
                else {
                    qq(textEl).setText(text);
                }
            }
        },

        hideSpinner: function(id) {
            hide(getSpinner(id));
        },

        showSpinner: function(id) {
            show(getSpinner(id));
        }
    };

    return api;
};
