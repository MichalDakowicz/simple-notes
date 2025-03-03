/**
 * Enhanced Masonry Layout for Notes
 * Using absolute positioning to create a true masonry layout
 */
class NoteMasonry {
    constructor(selector, options = {}) {
        this.container = document.querySelector(selector);
        this.options = Object.assign(
            {
                minColumnWidth: 220,
                maxColumns: 5,
                gutter: 16, // This controls the gap between cards
                animated: true,
            },
            options
        );

        // Initialize state
        this.items = [];
        this.columns = [];
        this.isInitialized = false;

        // Initialize immediately with a fixed timeout
        setTimeout(() => this.init(), 20);

        // Handle window resize events
        window.addEventListener(
            "resize",
            this.debounce(() => {
                this.layout();
            }, 150)
        );

        // Set up mutation observer
        this.setupMutationObserver();
    }

    init() {
        if (!this.container) return;

        console.log("Initializing masonry layout...");

        // Set container style
        this.container.style.position = "relative";

        // Get all items
        this.refresh();
    }

    setupMutationObserver() {
        if ("MutationObserver" in window) {
            const observer = new MutationObserver((mutations) => {
                let shouldRefresh = false;

                for (const mutation of mutations) {
                    if (
                        mutation.type === "childList" &&
                        (mutation.addedNodes.length ||
                            mutation.removedNodes.length)
                    ) {
                        shouldRefresh = true;
                        break;
                    }
                }

                if (shouldRefresh) {
                    clearTimeout(this.refreshTimeout);
                    this.refreshTimeout = setTimeout(() => this.refresh(), 50);
                }
            });

            observer.observe(this.container, {
                childList: true,
                subtree: false,
            });
        }
    }

    getColumnCount() {
        const containerWidth = this.container.offsetWidth;
        const minColumnWidth = this.options.minColumnWidth;
        const gutter = this.options.gutter;

        // Calculate how many columns can fit
        let count = Math.floor(
            (containerWidth + gutter) / (minColumnWidth + gutter)
        );

        // Apply limits
        count = Math.max(1, Math.min(count, this.options.maxColumns));

        return count;
    }

    layout() {
        if (!this.container) return;

        const columnCount = this.getColumnCount();
        const containerWidth = this.container.offsetWidth;
        const gutter = this.options.gutter;

        // Calculate actual column width - ensure equal spacing
        const availableWidth = containerWidth - (columnCount - 1) * gutter;
        const columnWidth = Math.floor(availableWidth / columnCount);

        console.log(
            `Layout: ${columnCount} columns of ${columnWidth}px width with ${gutter}px gutter`
        );

        // Reset columns heights
        this.columns = Array(columnCount).fill(0);

        // Position each item with consistent spacing
        this.items.forEach((item, index) => {
            // Reset any previous positioning
            item.style.width = `${columnWidth}px`;

            // Get shortest column
            const colIndex = this.getShortestColumnIndex();
            const xPos = colIndex * (columnWidth + gutter);
            const yPos = this.columns[colIndex];

            // Set position
            item.style.position = "absolute";
            item.style.left = `${xPos}px`;
            item.style.top = `${yPos}px`;

            // Show with animation
            if (this.options.animated) {
                item.style.transition =
                    "opacity 0.3s ease, transform 0.3s ease";
            }

            // Make note visible with a staggered effect
            setTimeout(() => {
                item.style.opacity = "1";
                item.style.transform = "translateY(0)";
            }, index * 20);

            // Force a reflow to get accurate height
            const itemHeight = item.offsetHeight;

            // Update column height with consistent gutter
            this.columns[colIndex] += itemHeight + gutter;
        });

        // Set container height, accounting for the bottom gutter
        const maxHeight = Math.max(...this.columns);
        // Subtract the final gutter if there are items
        const finalHeight = this.items.length > 0 ? maxHeight - gutter : 0;
        this.container.style.height = `${finalHeight}px`;

        console.log("Layout complete. Container height:", finalHeight);
    }

    getShortestColumnIndex() {
        let minHeight = Infinity;
        let index = 0;

        this.columns.forEach((height, i) => {
            if (height < minHeight) {
                minHeight = height;
                index = i;
            }
        });

        return index;
    }

    refresh() {
        // Get all items
        this.items = Array.from(this.container.children);

        console.log(
            `Refreshing masonry layout with ${this.items.length} items`
        );

        // Reset any transform/positioning
        this.items.forEach((item) => {
            item.style.transform = "translateY(10px)";
            item.style.opacity = "0";
        });

        // Position items
        if (this.items.length > 0) {
            this.layout();
            this.isInitialized = true;
        } else {
            // No items, reset container height
            this.container.style.height = "200px";
        }
    }

    debounce(func, wait) {
        let timeout;
        return function () {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.call(this), wait);
        };
    }
}

// Initialize masonry layout when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // Standardize the gutter to match CSS spacing variables
    const computedStyle = getComputedStyle(document.documentElement);
    const spacingMd =
        parseFloat(computedStyle.getPropertyValue("--spacing-md") || "1rem") *
        16;

    setTimeout(() => {
        console.log("Creating masonry layout");
        window.noteMasonry = new NoteMasonry("#notes-list", {
            minColumnWidth: window.innerWidth < 640 ? 160 : 220,
            maxColumns: 5,
            gutter: spacingMd, // Use standard spacing from CSS variables
            animated: true,
        });
    }, 100);
});
