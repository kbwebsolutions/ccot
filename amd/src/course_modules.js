/**
 * This file is part of Moodle - http://moodle.org/
 *
 * Moodle is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Moodle is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Moodle.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @package   theme_ccot
 * @author    Guy Thomas <osdev@blackboard.com>
 * @copyright Copyright (c) 2016 Blackboard Inc.
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Course main functions.
 */
define(
    [
        'jquery',
        'core/ajax',
        'theme_ccot/util',
        'theme_ccot/ajax_notification',
        'core/str'
    ],
    function($, ajax, util, ajaxNotify, str) {

        /**
         * Module has been completed.
         * @param {jQuery} module
         * @param {string} completionhtml
         */
        var updateModCompletion = function(module, completionhtml) {
            // Update completion tracking icon.
            module.find('.ccot-asset-completion-tracking').html(completionhtml);
            module.find('.btn-link').focus();
            $(document).trigger('ccotModuleCompletionChange', module);
        };

        /**
         * Listen for manual completion toggle.
         */
        var listenManualCompletion = function() {
            $('.course-content').on('submit', 'form.togglecompletion', function(e) {
                e.preventDefault();
                var form = $(this);

                if (form.hasClass('ajaxing')) {
                    // Request already in progress.
                    return;
                }

                var id = $(form).find('input[name="id"]').val();
                var completionState = $(form).find('input[name="completionstate"]').val();
                var module = $(form).parents('li.ccot-asset').first();
                form.addClass('ajaxing');

                ajax.call([
                    {
                        methodname: 'theme_ccot_course_module_completion',
                        args: {id: id, completionstate: completionState},
                        done: function(response) {

                            ajaxNotify.ifErrorShowBestMsg(response).done(function(errorShown) {
                                form.removeClass('ajaxing');
                                if (errorShown) {
                                    return;
                                } else {
                                    // No errors, update completion html for this module instance.
                                    updateModCompletion(module, response.completionhtml);
                                }
                            });
                        },
                        fail: function(response) {
                            ajaxNotify.ifErrorShowBestMsg(response).then(function() {
                                form.removeClass('ajaxing');
                            });
                        }
                    }
                ], true, true);

            });
        };

        /**
         * Reveal page module content.
         *
         * @param {jQuery} pageMod
         * @param {string} completionHTML - updated completionHTML
         */
        var revealPageMod = function(pageMod, completionHTML) {
            pageMod.find('.pagemod-content').slideToggle("fast", function() {
                // Animation complete.
                if (pageMod.is('.state-expanded')) {
                    pageMod.attr('aria-expanded', 'true');
                    pageMod.find('.pagemod-content').focus();

                } else {
                    pageMod.attr('aria-expanded', 'false');
                    pageMod.focus();
                }

            });

            if (completionHTML) {
                updateModCompletion(pageMod, completionHTML);
            }
        };

        /**
         * Page mod toggle content.
         */
        var listenPageModuleReadMore = function() {
            var pageToggleSelector = ".modtype_page .instancename,.pagemod-readmore,.pagemod-content .ccot-action-icon";
            $(document).on("click", pageToggleSelector, function(e) {
                var pageMod = $(this).closest('.modtype_page');
                util.scrollToElement(pageMod);
                var isexpanded = pageMod.hasClass('state-expanded');
                pageMod.toggleClass('state-expanded');

                var readmore = pageMod.find('.pagemod-readmore');

                var pageModContent = pageMod.find('.pagemod-content');
                if (pageModContent.data('content-loaded') == 1) {
                    // Content is already available so reveal it immediately.
                    revealPageMod(pageMod);
                    var readPageUrl = M.cfg.wwwroot + '/theme/ccot/rest.php?action=read_page&contextid=' +
                        readmore.data('pagemodcontext');
                    if (!isexpanded) {
                        $.ajax({
                            type: "GET",
                            async: true,
                            url: readPageUrl,
                            success: function(data) {
                                ajaxNotify.ifErrorShowBestMsg(data).done(function(errorShown) {
                                    if (errorShown) {
                                        return;
                                    } else {
                                        // No errors, update completion html for this page mod instance.
                                        updateModCompletion(pageMod, data.completionhtml);
                                    }
                                });
                            }
                        });
                    }
                } else {
                    if (!isexpanded) {
                        // Content is not available so request it.
                        var loadingStrPromise = str.get_string('loading', 'theme_ccot');
                        $.when(loadingStrPromise).done(function(loadingStr) {
                            pageMod.find('.contentafterlink').prepend(
                                '<div class="ajaxstatus alert alert-info">' + loadingStr + '</div>'
                            );
                        });
                        var getPageUrl = M.cfg.wwwroot + '/theme/ccot/rest.php?action=get_page&contextid=' +
                            readmore.data('pagemodcontext');
                        $.ajax({
                            type: "GET",
                            async: true,
                            url: getPageUrl,
                            success: function(data) {
                                ajaxNotify.ifErrorShowBestMsg(data).done(function(errorShown) {
                                    if (errorShown) {
                                        return;
                                    } else {
                                        // No errors, reveal page mod.
                                        pageModContent.prepend(data.html);
                                        pageModContent.data('content-loaded', 1);
                                        pageMod.find('.contentafterlink .ajaxstatus').remove();
                                        revealPageMod(pageMod, data.completionhtml);
                                    }
                                });
                            }
                        });
                    } else {
                        revealPageMod(pageMod);
                    }
                }

                e.preventDefault();
            });
        };

        /**
         * Light box media.
         * @param {str|jQuery} resourcemod
         */
        var lightboxMedia = function(resourcemod) {
            /**
             * Ensure lightbox container exists.
             *
             * @param {string} appendto
             * @param {function} onclose
             * @returns {*|jQuery|HTMLElement}
             */
            var lightbox = function(appendto, onclose) {
                var lbox = $('#ccot-light-box');
                if (lbox.length === 0) {
                    $(appendto).append('<div id="ccot-light-box" tabindex="-1">' +
                        '<div id="ccot-light-box-content"></div>' +
                        '<a id="ccot-light-box-close" class="pull-right ccot-action-icon ccot-icon-close" href="#">' +
                        '<small>Close</small>' +
                        '</a>' +
                        '</div>');
                    $('#ccot-light-box-close').click(function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        lightboxclose();
                        if (typeof (onclose) === 'function') {
                            onclose();
                        }
                    });
                    lbox = $('#ccot-light-box');
                }
                return lbox;
            };

            /**
             * Close lightbox.
             */
            var lightboxclose = function() {
                var lbox = lightbox();
                lbox.remove();
            };

            /**
             * Open lightbox and set content if necessary.
             *
             * @param {string} content
             * @param {*} appendto
             * @param {function} onclose
             */
            var lightboxopen = function(content, appendto, onclose) {
                appendto = appendto ? appendto : $('body');
                var lbox = lightbox(appendto, onclose);
                if (content) {
                    var contentdiv = $('#ccot-light-box-content');
                    contentdiv.html('');
                    contentdiv.append(content);
                }
                lbox.addClass('state-visible');
            };

            var appendto = $('body');
            var spinner = '<div class="loadingstat three-quarters">' +
                Y.Escape.html(M.util.get_string('loading', 'theme_ccot')) +
                '</div>';
            lightboxopen(spinner, appendto, function() {
                $(resourcemod).attr('tabindex', '-1').focus();
                $(resourcemod).removeAttr('tabindex');
            });

            $.ajax({
                type: "GET",
                async: true,
                url: M.cfg.wwwroot + '/theme/ccot/rest.php?action=get_media&contextid=' + $(resourcemod).data('modcontext'),
                success: function(data) {
                    ajaxNotify.ifErrorShowBestMsg(data).done(function(errorShown) {
                        if (errorShown) {
                            return;
                        } else {
                            // No errors, open lightbox and update module completion.
                            lightboxopen(data.html, appendto);
                            updateModCompletion($(resourcemod), data.completionhtml);
                            $(document).trigger('ccotContentRevealed');
                            $('#ccot-light-box').focus();
                        }
                    });
                }
            });

        };

        return {

            init: function() {

                // Listeners
                listenPageModuleReadMore();
                listenManualCompletion();

                // Add toggle class for hide/show activities/resources - additional to moodle adding dim.
                $(document).on("click", '[data-action=hide],[data-action=show]', function() {
                    $(this).closest('li.activity').toggleClass('draft');
                });

                // Make lightbox for list display of resources.
                $(document).on('click', '.js-ccot-media .ccot-asset-link [href*="/mod/resource/view.php?id="]', function(e) {
                    lightboxMedia($(this).closest('.ccot-resource'));
                    e.preventDefault();
                });

                // Make resource cards clickable.
                $(document).on('click', '.ccot-resource-card .ccot-resource', function(e) {
                    var trigger = $(e.target),
                        hreftarget = '_self',
                        link = $(trigger).closest('.ccot-resource').find('.ccot-asset-link a'),
                        href = '';
                    if (link.length > 0) {
                        href = $(link).attr('href');
                    }

                    // Excludes any clicks in the actions menu, on links or forms.
                    var selector = '.ccot-asset-completion-tracking, .ccot-asset-actions, .contentafterlink a, .ally-actions';
                    var withintarget = $(trigger).closest(selector).length;
                    if (!withintarget) {
                        if ($(this).hasClass('js-ccot-media')) {
                            lightboxMedia(this);
                        } else {
                            if (href === '') {
                                return;
                            }
                            if ($(link).attr('target') === '_blank') {
                                hreftarget = '_blank';
                            }
                            sessionStorage.setItem('lastMod', $(this).attr('id'));
                            window.open(href, hreftarget);
                        }
                        e.preventDefault();
                    }
                });
            }
        };
    }
);
