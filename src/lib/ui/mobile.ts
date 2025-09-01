import { type Ref, watch } from 'vue';
import { f7, f7ready } from 'framework7-vue';
import type { Dialog, Picker, Router } from 'framework7/types';

import { useI18n } from '@/locales/helpers.ts';

import { TextDirection } from '@/core/text.ts';
import { FontSize, FONT_SIZE_PREVIEW_CLASSNAME_PREFIX } from '@/core/font.ts';
import { getNumberValue } from '../common.ts';
import { isEnableAnimate } from '../settings.ts';

export interface Framework7Dom {
    length: number;
    [index: number]: Element;
    find: (selector?: string) => Framework7Dom;
    offset(): { top: number; left: number };
    scrollTop(position: number, duration?: number, callback?: () => void): Framework7Dom;
    outerHeight(includeMargin?: boolean): number;
    css(property: string): string | number;
}

export function showLoading(delayConditionFunc?: () => boolean, delayMills?: number): void {
    if (!delayConditionFunc) {
        f7ready((f7) => {
            return f7.preloader.show();
        });
        return;
    }

    f7ready((f7) => {
        setTimeout(() => {
            if (delayConditionFunc()) {
                f7.preloader.show();
            }
        }, delayMills || 200);
    });
}

export function hideLoading(): void {
    f7ready((f7) => {
        return f7.preloader.hide();
    });
}

export function createInlinePicker(containerEl: string, inputEl: string, cols: Picker.ColumnParameters[], value: string[], events?: { change: (picker: Picker.Picker, value: unknown, displayValue: unknown) => void }): Picker.Picker {
    return f7.picker.create({
        containerEl: containerEl,
        inputEl: inputEl,
        toolbar: false,
        rotateEffect: true,
        value: value,
        cols: cols,
        on: events || {}
    });
}

export function isModalShowing(): number {
    return f7.$('.modal-in').length;
}

export function onSwipeoutDeleted(domId: string, callback: () => void): void {
    f7.swipeout.delete(f7.$('#' + domId), callback);
}

export function autoChangeTextareaSize(el: HTMLElement): void {
    f7.$(el).find('textarea').each((child: HTMLElement) => {
        child.scrollTop = 0;
        child.style.height = '';
        child.style.height = child.scrollHeight + 'px';
    });
}

export function setAppFontSize(type: number): void {
    const htmlElement = f7.$('html');
    const allFontSizes = FontSize.values();

    for (let i = 0; i < allFontSizes.length; i++) {
        const fontSizeType = allFontSizes[i];

        if (fontSizeType.type === type) {
            if (!htmlElement.hasClass(fontSizeType.className)) {
                htmlElement.addClass(fontSizeType.className);
            }
        } else {
            htmlElement.removeClass(fontSizeType.className);
        }
    }
}

export function getFontSizePreviewClassName(type: number): string {
    const allFontSizes = FontSize.values();

    for (let i = 0; i < allFontSizes.length; i++) {
        const fontSizeType = allFontSizes[i];

        if (fontSizeType.type === type) {
            return FONT_SIZE_PREVIEW_CLASSNAME_PREFIX + fontSizeType.className;
        }
    }

    return FONT_SIZE_PREVIEW_CLASSNAME_PREFIX + FontSize.Default.className;
}

export function getElementActualHeights(selector: string): Record<string, number> {
    const elements = f7.$(selector);
    const heights: Record<string, number> = {};

    if (!elements || !elements.length) {
        return heights;
    }

    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const rect = el.getBoundingClientRect();
        heights[el.id] = rect.height;
    }

    return heights;
}

export function getElementBoundingRect(selector: string): DOMRect | null {
    const elements = f7.$(selector);

    if (!elements || !elements.length) {
        return null;
    }

    const el = elements[0];
    return el.getBoundingClientRect();
}

export function scrollToSelectedItem(parentEl: Framework7Dom, containerSelector: string, selectedItemSelector: string): void {
    if (!parentEl || !parentEl.length) {
        return;
    }

    const container = parentEl.find(containerSelector);
    const selectedItem = parentEl.find(selectedItemSelector);

    if (!container.length || !selectedItem.length) {
        return;
    }

    const containerPaddingTop = getNumberValue(container.css('padding-top'), 0) / 2;

    let targetPos = selectedItem.offset().top - container.offset().top - containerPaddingTop
        - (container.outerHeight() - selectedItem.outerHeight()) / 2;

    if (selectedItem.length > 1) {
        const firstSelectedItem = f7.$(selectedItem[0]);
        const lastSelectedItem = f7.$(selectedItem[selectedItem.length - 1]);

        const firstSelectedItemInTop = firstSelectedItem.offset().top - container.offset().top - containerPaddingTop;
        const lastSelectedItemInTop = lastSelectedItem.offset().top - container.offset().top - containerPaddingTop;
        const lastSelectedItemInBottom = lastSelectedItem.offset().top - container.offset().top - containerPaddingTop
            - (container.outerHeight() - firstSelectedItem.outerHeight());

        targetPos = (firstSelectedItemInTop + lastSelectedItemInBottom) / 2;

        if (lastSelectedItemInTop - firstSelectedItemInTop > container.outerHeight()) {
            targetPos = firstSelectedItemInTop;
        }
    }

    if (targetPos <= 0) {
        return;
    }

    container.scrollTop(targetPos);
}

export function scrollSheetToTop(sheetElement: HTMLElement | undefined, windowNormalInnerHeight: number): void {
    if (!sheetElement) {
        return;
    }

    const sheetHeight = sheetElement.offsetHeight;

    if (sheetHeight < windowNormalInnerHeight) {
        setTimeout(() => {
            const windowNewInnerHeight = window.innerHeight;

            if (windowNewInnerHeight < windowNormalInnerHeight && sheetHeight < windowNewInnerHeight) {
                window.scrollTo({ top: windowNormalInnerHeight - sheetHeight - 24, behavior: "smooth" });
            }
        }, 300);
    }
}

export function onInfiniteScrolling(callback: (e: Event) => void): void {
    f7.$('.infinite-scroll-content').on('scroll', (e: Event) => {
        callback(e);
    }, {
        passive: true
    });
}

export function useI18nUIComponents() {
    const { tt, te, getCurrentLanguageTextDirection } = useI18n();

    function routeBackOnError<T>(f7router: Router.Router, errorRef: Ref<T>): void {
        const unwatch = watch(errorRef, (newValue) => {
            if (newValue) {
                setTimeout(() => {
                    if (unwatch) {
                        unwatch();
                    }

                    f7router.back();
                }, 200);
            }
        }, {
            immediate: true
        });
    }

    function showAlert(message: string, confirmCallback?: (dialog: Dialog.Dialog, e: Event) => void): void {
        f7ready((f7) => {
            f7.dialog.create({
                title: tt('global.app.title'),
                text: te(message),
                animate: isEnableAnimate(),
                buttons: [
                    {
                        text: tt('OK'),
                        onClick: confirmCallback
                    }
                ]
            }).open();
        });
    }

    function showConfirm(message: string, confirmCallback?: (dialog: Dialog.Dialog, e: Event) => void, cancelCallback?: (dialog: Dialog.Dialog, e: Event) => void): void {
        const textDirection = getCurrentLanguageTextDirection();

        const cancelButton: Dialog.DialogButton = {
            text: tt('Cancel'),
            onClick: cancelCallback
        };

        const confirmButton: Dialog.DialogButton = {
            text: tt('OK'),
            onClick: confirmCallback
        };

        f7ready((f7) => {
            f7.dialog.create({
                title: tt('global.app.title'),
                text: tt(message),
                animate: isEnableAnimate(),
                buttons: textDirection == TextDirection.RTL ? [confirmButton, cancelButton] : [cancelButton, confirmButton]
            }).open();
        });
    }

    function showPrompt(message: string, currentValue?: string, confirmCallback?: (value: string, dialog: Dialog.Dialog, e: Event) => void, cancelCallback?: (value: string, dialog: Dialog.Dialog, e: Event) => void): void {
        const textDirection = getCurrentLanguageTextDirection();

        const cancelButton: Dialog.DialogButton = {
            text: tt('Cancel'),
            onClick: (dialog, event) => {
                if (cancelCallback) {
                    const inputValue = dialog.$el.find('.dialog-input').val();
                    cancelCallback(inputValue, dialog, event);
                }
            }
        };

        const confirmButton: Dialog.DialogButton = {
            text: tt('OK'),
            onClick: (dialog, event) => {
                if (confirmCallback) {
                    const inputValue = dialog.$el.find('.dialog-input').val();
                    confirmCallback(inputValue, dialog, event);
                }
            }
        };

        f7ready((f7) => {
            f7.dialog.create({
                title: tt('global.app.title'),
                text: tt(message),
                content: `<div class="dialog-input-field input"><input type="text" class="dialog-input" value="${currentValue || ''}"></div>`,
                animate: isEnableAnimate(),
                buttons: textDirection == TextDirection.RTL ? [confirmButton, cancelButton] : [cancelButton, confirmButton]
            }).open();
        });
    }

    function showToast(message: string, timeout?: number): void {
        f7ready((f7) => {
            f7.toast.create({
                text: te(message),
                position: 'center',
                closeTimeout: timeout || 1500
            }).open();
        });
    }

    return {
        showAlert: showAlert,
        showConfirm: showConfirm,
        showPrompt: showPrompt,
        showToast: showToast,
        routeBackOnError
    }
}
