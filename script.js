document.addEventListener("DOMContentLoaded", () => {
    loadNotes();

    document.getElementById("add-note").addEventListener("click", createNote);

    document.getElementById("note-body").addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            createNote();
        }
    });

    const textarea = document.getElementById("note-body");
    textarea.addEventListener("input", () => {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";

        updateMainFormTaskPreview(textarea.value);
    });

    const addTaskBtn = document.getElementById("add-task-btn");
    addTaskBtn.addEventListener("click", () => {
        insertTaskTemplate(textarea);
        updateMainFormTaskPreview(textarea.value);
    });

    setupColorPicker();

    initModals();

    const noteFormTextarea = document.getElementById("note-body");
    const markdownHint = document.createElement("div");
    markdownHint.className = "markdown-hint";
    markdownHint.innerHTML = "<i>Markdown formatting supported</i>";
    markdownHint.style.fontSize = "0.8rem";
    markdownHint.style.opacity = "0.7";
    markdownHint.style.marginTop = "-0.5rem";
    noteFormTextarea.parentNode.insertBefore(
        markdownHint,
        noteFormTextarea.nextSibling
    );

    if (typeof marked !== "undefined") {
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: false,
            langPrefix: "language-",
            highlight: function (code, lang) {
                if (lang && Prism.languages[lang]) {
                    return Prism.highlight(code, Prism.languages[lang], lang);
                }
                return code;
            },
        });
    }

    setTimeout(ensureMasonryLayout, 200);

    window.addEventListener("resize", () => {
        if (window.noteMasonry) {
            window.noteMasonry.refresh();
        }
    });

    const noteTitleInput = document.getElementById("note-title");
    const noteTitleCount = document.getElementById("note-title-charcount");
    noteTitleInput.addEventListener("input", () => {
        const remaining = 60 - noteTitleInput.value.length;
        noteTitleCount.textContent =
            remaining >= 0 ? `${remaining} characters remaining` : "";
    });

    const editTitleInput = document.getElementById("edit-title");
    const editTitleCount = document.getElementById("edit-title-charcount");
    if (editTitleInput) {
        editTitleInput.addEventListener("input", () => {
            const remaining = 60 - editTitleInput.value.length;
            editTitleCount.textContent =
                remaining >= 0 ? `${remaining} characters remaining` : "";
        });
    }

    const noteBody = document.getElementById("note-body");
    noteBody.addEventListener("keydown", function (e) {
        if (e.key === "Tab") {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.value =
                this.value.substring(0, start) +
                "\t" +
                this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 1;
        }
    });

    const editBody = document.getElementById("edit-body");
    if (editBody) {
        editBody.addEventListener("keydown", function (e) {
            if (e.key === "Tab") {
                e.preventDefault();
                const start = this.selectionStart;
                const end = this.selectionEnd;
                this.value =
                    this.value.substring(0, start) +
                    "\t" +
                    this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + 1;
            }
        });
    }

    document.fonts.ready.then(() => {
        setTimeout(() => {
            if (window.noteMasonry) {
                window.noteMasonry.refresh();
            } else {
                if (typeof NoteMasonry === "function") {
                    const computedStyle = getComputedStyle(
                        document.documentElement
                    );
                    const spacingMd =
                        parseFloat(
                            computedStyle.getPropertyValue("--spacing-md") ||
                                "1rem"
                        ) * 16;
                    window.noteMasonry = new NoteMasonry("#notes-list", {
                        minColumnWidth: window.innerWidth < 640 ? 160 : 220,
                        maxColumns: 4,
                        gutter: spacingMd,
                        animated: true,
                    });
                }
            }
        }, 300);
    });
    window.addEventListener("load", function () {
        setTimeout(() => {
            if (window.noteMasonry) {
                window.noteMasonry.refresh();
            } else if (typeof NoteMasonry === "function") {
                const computedStyle = getComputedStyle(
                    document.documentElement
                );
                const spacingMd =
                    parseFloat(
                        computedStyle.getPropertyValue("--spacing-md") || "1rem"
                    ) * 16;
                window.noteMasonry = new NoteMasonry("#notes-list", {
                    minColumnWidth: window.innerWidth < 640 ? 160 : 220,
                    maxColumns: 4,
                    gutter: spacingMd,
                    animated: true,
                });
            }
        }, 200);
    });

    function insertMarkdownFormat(textarea, marker) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const selectedText = value.substring(start, end);
        const insertText = marker + selectedText + marker;
        textarea.value =
            value.substring(0, start) + insertText + value.substring(end);
        if (selectedText.length === 0) {
            textarea.selectionStart = textarea.selectionEnd =
                start + marker.length;
        } else {
            textarea.selectionStart = start;
            textarea.selectionEnd = start + insertText.length;
        }
        textarea.focus();
    }

    function insertQuoteFormat(textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const selectedText = value.substring(start, end);
        const lines = selectedText.split(/\r?\n/).map((line) => "> " + line);
        const insertText = lines.join("\n");
        textarea.value =
            value.substring(0, start) + insertText + value.substring(end);
        textarea.selectionStart = textarea.selectionEnd =
            start + insertText.length;
        textarea.focus();
    }

    function insertLinkFormat(textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const selectedText = value.substring(start, end) || "link text";
        const insertText = `[${selectedText}](url)`;
        textarea.value =
            value.substring(0, start) + insertText + value.substring(end);
        const linkStart = start + insertText.indexOf("url");
        textarea.selectionStart = linkStart;
        textarea.selectionEnd = linkStart + 3;
        textarea.focus();
    }

    function insertHeadingFormat(textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const selectedText = value.substring(start, end);
        const lines = selectedText.split(/\r?\n/).map((line) => {
            return line.trim() ? "# " + line : line;
        });
        const insertText = lines.join("\n");
        textarea.value =
            value.substring(0, start) + insertText + value.substring(end);
        textarea.selectionStart = textarea.selectionEnd =
            start + insertText.length;
        textarea.focus();
    }

    function insertMultilineCodeBlockFormat(textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const selectedText = value.substring(start, end);
        const insertText = "```\n" + selectedText + "\n```";
        textarea.value =
            value.substring(0, start) + insertText + value.substring(end);
        if (!selectedText) {
            textarea.selectionStart = textarea.selectionEnd = start + 4;
        } else {
            textarea.selectionStart = textarea.selectionEnd =
                start + insertText.length;
        }
        textarea.focus();
    }

    function insertListFormat(textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const selectedText = value.substring(start, end);
        const lines = selectedText
            .split(/\r?\n/)
            .map((line) => "- " + line.trim());
        const insertText = lines.join("\n");
        textarea.value =
            value.substring(0, start) + insertText + value.substring(end);
        textarea.selectionStart = textarea.selectionEnd =
            start + insertText.length;
        textarea.focus();
    }

    const noteTextarea = document.getElementById("note-body");
    const boldBtn = document.getElementById("bold-btn");
    const italicBtn = document.getElementById("italic-btn");
    const codeBtn = document.getElementById("code-btn");
    const quoteBtn = document.getElementById("quote-btn");
    const linkBtn = document.getElementById("link-btn");
    const headingBtn = document.getElementById("heading-btn");
    const multicodeBtn = document.getElementById("multicode-btn");
    const listBtn = document.getElementById("list-btn");
    if (boldBtn && noteTextarea) {
        boldBtn.addEventListener("click", () => {
            insertMarkdownFormat(noteTextarea, "**");
        });
    }
    if (italicBtn && noteTextarea) {
        italicBtn.addEventListener("click", () => {
            insertMarkdownFormat(noteTextarea, "_");
        });
    }
    if (codeBtn && noteTextarea) {
        codeBtn.addEventListener("click", () => {
            insertMarkdownFormat(noteTextarea, "`");
        });
    }
    if (quoteBtn && noteTextarea) {
        quoteBtn.addEventListener("click", () => {
            insertQuoteFormat(noteTextarea);
        });
    }
    if (linkBtn && noteTextarea) {
        linkBtn.addEventListener("click", () => {
            insertLinkFormat(noteTextarea);
        });
    }
    if (headingBtn && noteTextarea) {
        headingBtn.addEventListener("click", () => {
            insertHeadingFormat(noteTextarea);
        });
    }
    if (multicodeBtn && noteTextarea) {
        multicodeBtn.addEventListener("click", () => {
            insertMultilineCodeBlockFormat(noteTextarea);
        });
    }
    if (listBtn && noteTextarea) {
        listBtn.addEventListener("click", () => {
            insertListFormat(noteTextarea);
        });
    }

    const editTextarea = document.getElementById("edit-body");
    const editBoldBtn = document.getElementById("edit-bold-btn");
    const editItalicBtn = document.getElementById("edit-italic-btn");
    const editCodeBtn = document.getElementById("edit-code-btn");
    const editQuoteBtn = document.getElementById("edit-quote-btn");
    const editLinkBtn = document.getElementById("edit-link-btn");
    const editHeadingBtn = document.getElementById("edit-heading-btn");
    const editMulticodeBtn = document.getElementById("edit-multicode-btn");
    const editListBtn = document.getElementById("edit-list-btn");
    if (editBoldBtn && editTextarea) {
        editBoldBtn.addEventListener("click", () => {
            insertMarkdownFormat(editTextarea, "**");
        });
    }
    if (editItalicBtn && editTextarea) {
        editItalicBtn.addEventListener("click", () => {
            insertMarkdownFormat(editTextarea, "_");
        });
    }
    if (editCodeBtn && editTextarea) {
        editCodeBtn.addEventListener("click", () => {
            insertMarkdownFormat(editTextarea, "`");
        });
    }
    if (editQuoteBtn && editTextarea) {
        editQuoteBtn.addEventListener("click", () => {
            insertQuoteFormat(editTextarea);
        });
    }
    if (editLinkBtn && editTextarea) {
        editLinkBtn.addEventListener("click", () => {
            insertLinkFormat(editTextarea);
        });
    }
    if (editHeadingBtn && editTextarea) {
        editHeadingBtn.addEventListener("click", () => {
            insertHeadingFormat(editTextarea);
        });
    }
    if (editMulticodeBtn && editTextarea) {
        editMulticodeBtn.addEventListener("click", () => {
            insertMultilineCodeBlockFormat(editTextarea);
        });
    }
    if (editListBtn && editTextarea) {
        editListBtn.addEventListener("click", () => {
            insertListFormat(editTextarea);
        });
    }
});

function insertTaskTemplate(textarea) {
    const position = textarea.selectionStart;
    const content = textarea.value;
    const before = content.substring(0, position);
    const after = content.substring(position);

    let prefix = "";
    if (
        position > 0 &&
        before.charAt(before.length - 1) !== "\n" &&
        before.trim() !== ""
    ) {
        prefix = "\n";
    }

    const taskTemplate = `${prefix}- [ ] `;
    textarea.value = before + taskTemplate + after;

    const newPosition = position + taskTemplate.length;
    textarea.focus();
    textarea.setSelectionRange(newPosition, newPosition);

    textarea.style.height = "auto";
    textarea.style.height = Math.min(300, textarea.scrollHeight) + "px";

    if (textarea.id === "edit-body") {
        updateTaskPreview(textarea.value);
    } else if (textarea.id === "note-body") {
        updateMainFormTaskPreview(textarea.value);
    }
}

function setupColorPicker(selector = ".color-options") {
    const colors = [
        { name: "white", value: "var(--note-white)" },
        { name: "red", value: "var(--note-red)" },
        { name: "orange", value: "var(--note-orange)" },
        { name: "yellow", value: "var(--note-yellow)" },
        { name: "green", value: "var(--note-green)" },
        { name: "teal", value: "var(--note-teal)" },
        { name: "blue", value: "var(--note-blue)" },
        { name: "purple", value: "var(--note-purple)" },
    ];

    const colorOptions = document.querySelector(selector);
    if (!colorOptions) return;

    while (colorOptions.firstChild) {
        colorOptions.removeChild(colorOptions.firstChild);
    }

    colors.forEach((color) => {
        const option = document.createElement("div");
        option.className = "color-option";
        option.dataset.color = color.name;
        option.style.backgroundColor = color.value;
        option.setAttribute("title", `${color.name} note`);

        option.addEventListener("click", () => {
            colorOptions
                .querySelectorAll(".color-option")
                .forEach((opt) => opt.classList.remove("selected"));

            option.classList.add("selected");

            option.style.transform = "scale(1.3)";
            setTimeout(() => {
                option.style.transform = "";
            }, 200);
        });

        if (color.name === "white") {
            option.classList.add("selected");
        }

        colorOptions.appendChild(option);
    });
}

function createNote() {
    const titleInput = document.getElementById("note-title");
    const bodyInput = document.getElementById("note-body");
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (!title && !body) {
        showFormError("Please add a title or note content before saving");
        return;
    }

    const selectedColor = document.querySelector(".color-option.selected");
    const color = selectedColor ? selectedColor.dataset.color : "white";

    const noteId = Date.now().toString();
    const createdAt = new Date();

    const noteData = {
        id: noteId,
        title,
        body,
        color,
        created: createdAt,
        lastEdited: createdAt,
        tasks: extractTasks(body),
    };

    addNoteToPage(noteData);
    saveNoteToStorage(noteData);

    titleInput.value = "";
    bodyInput.value = "";
    bodyInput.style.height = "auto";

    const mainTaskPreview = document.getElementById("main-task-preview");
    if (mainTaskPreview) {
        mainTaskPreview.style.display = "none";
    }

    document
        .querySelectorAll(".color-option")
        .forEach((opt) => opt.classList.remove("selected"));
    document
        .querySelector('.color-option[data-color="white"]')
        .classList.add("selected");

    titleInput.focus();

    const formButton = document.getElementById("add-note");
    formButton.textContent = "Added!";
    formButton.style.backgroundColor = "#34A853";

    setTimeout(() => {
        formButton.textContent = "Done";
        formButton.style.backgroundColor = "";
    }, 1000);
}

function showFormError(message = "Please enter some content before saving") {
    const form = document.getElementById("note-form");
    form.classList.add("shake");

    let errorMsg = document.getElementById("form-error-msg");
    if (!errorMsg) {
        errorMsg = document.createElement("div");
        errorMsg.id = "form-error-msg";
        errorMsg.style.color = "#EA4335";
        errorMsg.style.fontSize = "0.85rem";
        errorMsg.style.marginTop = "0.5rem";
        errorMsg.style.padding = "0.5rem";
        errorMsg.style.borderRadius = "4px";
        errorMsg.style.backgroundColor = "rgba(234, 67, 53, 0.1)";

        const formActions = document.querySelector("#note-form .form-actions");
        form.insertBefore(errorMsg, formActions);
    }

    errorMsg.textContent = message;
    errorMsg.style.opacity = "1";
    errorMsg.style.transform = "translateY(0)";

    const titleInput = document.getElementById("note-title");
    const bodyInput = document.getElementById("note-body");

    if (!titleInput.value.trim() && !bodyInput.value.trim()) {
        titleInput.style.borderBottom = "2px solid #EA4335";
        bodyInput.style.borderBottom = "2px solid #EA4335";
    } else if (!titleInput.value.trim()) {
        titleInput.style.borderBottom = "2px solid #EA4335";
        bodyInput.style.borderBottom = "";
    } else {
        titleInput.style.borderBottom = "";
        bodyInput.style.borderBottom = "2px solid #EA4335";
    }

    setTimeout(() => {
        form.classList.remove("shake");

        errorMsg.style.opacity = "0";
        errorMsg.style.transform = "translateY(-10px)";

        titleInput.style.borderBottom = "";
        bodyInput.style.borderBottom = "";

        setTimeout(() => {
            if (errorMsg.parentNode) {
                errorMsg.parentNode.removeChild(errorMsg);
            }
        }, 300);
    }, 2000);
}

function extractTasks(content) {
    const tasks = [];
    const regex = /- \[([ x])\] (.+)(?:\r\n|\r|\n|$)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        tasks.push({
            id: Date.now() + Math.random().toString(36).substr(2, 5),
            text: match[2].trim(),
            completed: match[1] === "x",
        });
    }

    return tasks;
}

function addNoteToPage(note) {
    const notesList = document.getElementById("notes-list");
    const noteCard = createNoteCard(note);

    notesList.prepend(noteCard);

    setTimeout(() => {
        if (window.noteMasonry) {
            window.noteMasonry.refresh();
        }
    }, 50);
}

function loadNotes() {
    const notes = JSON.parse(localStorage.getItem("notes") || "[]");

    if (notes.length > 0) {
        console.log(`Loading ${notes.length} notes...`);

        const notesList = document.getElementById("notes-list");

        while (notesList.firstChild) {
            notesList.removeChild(notesList.firstChild);
        }

        const fragment = document.createDocumentFragment();

        notes.forEach((note) => {
            const noteCard = createNoteCard(note);
            fragment.prepend(noteCard);
        });

        document.getElementById("notes-list").appendChild(fragment);

        setTimeout(() => {
            if (window.noteMasonry) {
                window.noteMasonry.refresh();
            }
        }, 100);
    }
}

function deleteNote(noteId) {
    const noteCard = document.querySelector(`.note-card[data-id="${noteId}"]`);
    if (noteCard) {
        noteCard.style.opacity = "0";
        noteCard.style.transform = "scale(0.85) translateY(10px)";

        setTimeout(() => {
            noteCard.remove();

            let notes = JSON.parse(localStorage.getItem("notes") || "[]");
            notes = notes.filter((note) => note.id !== noteId);
            localStorage.setItem("notes", JSON.stringify(notes));

            if (window.noteMasonry) {
                window.noteMasonry.refresh();
            }
        }, 250);
    }
}

function saveNoteToStorage(noteData) {
    const notes = JSON.parse(localStorage.getItem("notes") || "[]");
    notes.unshift(noteData);
    localStorage.setItem("notes", JSON.stringify(notes));
}

function showFormError() {
    const form = document.getElementById("note-form");
    form.classList.add("shake");

    const textarea = document.getElementById("note-body");
    textarea.style.borderBottom = "2px solid #EA4335";

    setTimeout(() => {
        form.classList.remove("shake");
        textarea.style.borderBottom = "";
    }, 600);
}

function getRandomColor() {
    const colors = [
        "white",
        "red",
        "orange",
        "yellow",
        "green",
        "teal",
        "blue",
        "purple",
    ];
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
}

function createNoteCard(note) {
    const noteCard = document.createElement("div");
    noteCard.className = `note-card note-${note.color}`;
    noteCard.dataset.id = note.id;

    noteCard.addEventListener("click", (e) => {
        if (
            !e.target.closest(".note-actions") &&
            !e.target.closest(".task-checkbox")
        ) {
            openEditModal(note.id);
        }
    });

    const noteContent = document.createElement("div");
    noteContent.className = "note-content";
    noteContent.style.width = "100%";
    if (note.title) {
        const noteTitle = document.createElement("h3");
        noteTitle.textContent = note.title;
        noteContent.appendChild(noteTitle);
    }

    const processedContent = processNoteContent(note);
    noteContent.appendChild(processedContent);

    const noteFooter = document.createElement("div");
    noteFooter.className = "note-footer";

    const timestampDiv = document.createElement("div");
    timestampDiv.className = "note-timestamp";

    const createdSpan = document.createElement("span");
    createdSpan.textContent = `Created: ${formatDate(new Date(note.created))}`;
    timestampDiv.appendChild(createdSpan);

    if (note.lastEdited && note.lastEdited !== note.created) {
        const editedSpan = document.createElement("span");
        editedSpan.textContent = `Edited: ${formatDate(
            new Date(note.lastEdited)
        )}`;
        timestampDiv.appendChild(editedSpan);
    }

    noteFooter.appendChild(timestampDiv);

    const noteActions = document.createElement("div");
    noteActions.className = "note-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "edit-note";
    editBtn.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
    editBtn.setAttribute("aria-label", "Edit note");
    editBtn.setAttribute("title", "Edit note");
    editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openEditModal(note.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-note";
    deleteBtn.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"></path><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
    deleteBtn.setAttribute("aria-label", "Delete note");
    deleteBtn.setAttribute("title", "Delete note");
    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openDeleteModal(note.id);
    });

    noteActions.appendChild(editBtn);
    noteActions.appendChild(deleteBtn);

    noteFooter.appendChild(noteActions);

    noteContent.appendChild(noteFooter);

    setTimeout(() => {
        const noteBody = noteCard.querySelector(".note-body");
        if (noteBody && noteBody.scrollHeight > noteBody.clientHeight) {
            noteBody.classList.add("scrollable");

            const footer = noteCard.querySelector(".note-footer");
            if (footer) {
                footer.style.boxShadow = "0 -4px 6px -6px rgba(0, 0, 0, 0.15)";
            }

            noteBody.addEventListener("scroll", function () {
                const nearBottom =
                    this.scrollHeight - this.scrollTop - this.clientHeight < 20;

                if (nearBottom) {
                    footer.style.boxShadow = "none";
                } else {
                    footer.style.boxShadow =
                        "0 -4px 6px -6px rgba(0, 0, 0, 0.15)";
                }
            });
        }
    }, 10);

    noteCard.appendChild(noteContent);

    requestAnimationFrame(() => {
        noteCard.style.opacity = "0";
        noteCard.style.transform = "translateY(20px)";

        void noteCard.offsetWidth;

        setTimeout(() => {
            noteCard.style.opacity = "1";
            noteCard.style.transform = "translateY(0)";
        }, 30);
    });

    return noteCard;
}

function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
        return "Just now";
    } else if (minutes < 60) {
        return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
    } else if (hours < 24) {
        return `${hours} h${hours > 1 ? "" : ""} ago`;
    } else if (days < 7) {
        return `${days} d${days > 1 ? "" : ""} ago`;
    } else {
        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
}

function processNoteContent(note) {
    const container = document.createElement("div");
    container.className = "note-body";

    try {
        if (note.tasks && note.tasks.length > 0) {
            const body = note.body;
            const taskList = document.createElement("div");
            taskList.className = "task-list";

            note.tasks.forEach((task) => {
                const taskItem = document.createElement("div");
                taskItem.className = "task-item";
                taskItem.dataset.taskId = task.id;

                const label = document.createElement("label");

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.className = "task-checkbox";
                checkbox.checked = task.completed;
                checkbox.addEventListener("change", (e) => {
                    e.stopPropagation();
                    toggleTask(note.id, task.id, e.target.checked);
                });

                const taskText = document.createElement("span");
                taskText.className =
                    "task-text" + (task.completed ? " completed" : "");
                taskText.textContent = task.text;

                label.appendChild(checkbox);
                label.appendChild(taskText);
                taskItem.appendChild(label);

                taskItem.addEventListener("click", (e) => {
                    if (e.target !== checkbox) {
                        e.preventDefault();
                        e.stopPropagation();
                        checkbox.checked = !checkbox.checked;
                        toggleTask(note.id, task.id, checkbox.checked);
                    }
                });

                taskList.appendChild(taskItem);
            });

            container.appendChild(taskList);

            const textContent = note.body
                .replace(/- \[[ x]\] .+(\r\n|\r|\n|$)/g, "")
                .trim();

            if (textContent) {
                const textPara = document.createElement("div");
                textPara.className = "note-text markdown-body";

                try {
                    if (typeof marked !== "undefined") {
                        textPara.innerHTML = marked.parse(textContent);
                    } else {
                        throw new Error("Markdown parser not available");
                    }
                } catch (err) {
                    console.warn("Error parsing markdown:", err);
                    textPara.textContent = textContent;
                }

                if (typeof hljs !== "undefined") {
                    try {
                        textPara
                            .querySelectorAll("pre code")
                            .forEach((block) => {
                                hljs.highlightElement(block);
                            });
                    } catch (err) {
                        console.warn(
                            "Error applying syntax highlighting:",
                            err
                        );
                    }
                }

                container.appendChild(textPara);
            }
        } else {
            const markdownDiv = document.createElement("div");
            markdownDiv.className = "note-text markdown-body";

            try {
                if (typeof marked !== "undefined") {
                    markdownDiv.innerHTML = marked.parse(note.body);
                } else {
                    throw new Error("Markdown parser not available");
                }
            } catch (err) {
                console.warn("Error parsing markdown:", err);
                markdownDiv.textContent = note.body;
            }

            if (typeof hljs !== "undefined") {
                try {
                    markdownDiv
                        .querySelectorAll("pre code")
                        .forEach((block) => {
                            hljs.highlightElement(block);
                        });
                } catch (err) {
                    console.warn("Error applying syntax highlighting:", err);
                }
            }

            container.appendChild(markdownDiv);
        }
    } catch (err) {
        console.error("Error processing note content:", err);
        const textDiv = document.createElement("div");
        textDiv.className = "note-text";
        textDiv.textContent = note.body;
        container.appendChild(textDiv);
    }

    return container;
}

function toggleTask(noteId, taskId, completed) {
    const notes = JSON.parse(localStorage.getItem("notes") || "[]");
    const noteIndex = notes.findIndex((n) => n.id === noteId);

    if (noteIndex !== -1) {
        const taskIndex = notes[noteIndex].tasks.findIndex(
            (t) => t.id === taskId
        );

        if (taskIndex !== -1) {
            const task = notes[noteIndex].tasks[taskIndex];
            task.completed = completed;

            const taskText = task.text;
            const escapedTaskText = taskText.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            const taskRegex = new RegExp(
                `- \\[[ x]\\] ${escapedTaskText}(\r\n|\r|\n|$)`,
                "g"
            );

            notes[noteIndex].body = notes[noteIndex].body.replace(
                taskRegex,
                `- [${completed ? "x" : " "}] ${taskText}$1`
            );

            notes[noteIndex].lastEdited = new Date();

            localStorage.setItem("notes", JSON.stringify(notes));

            const taskItem = document.querySelector(
                `.note-card[data-id="${noteId}"] .task-item[data-task-id="${taskId}"]`
            );

            if (taskItem) {
                const taskTextElement = taskItem.querySelector(".task-text");
                const checkbox = taskItem.querySelector(".task-checkbox");

                if (taskTextElement) {
                    if (completed) {
                        taskTextElement.classList.add("completed");
                    } else {
                        taskTextElement.classList.remove("completed");
                    }
                }

                if (checkbox && checkbox.checked !== completed) {
                    checkbox.checked = completed;
                }
            }

            updateTimestamp(noteId);
        }
    }
}

function updateTimestamp(noteId) {
    const note = getNoteById(noteId);
    if (!note) return;

    const noteCard = document.querySelector(`.note-card[data-id="${noteId}"]`);
    if (!noteCard) return;

    const timestampDiv = noteCard.querySelector(".note-timestamp");
    if (timestampDiv) {
        let editedSpan = timestampDiv.querySelector("span:nth-child(2)");
        const formattedDate = formatDate(new Date(note.lastEdited));

        if (!editedSpan) {
            editedSpan = document.createElement("span");
            timestampDiv.appendChild(editedSpan);
        }

        editedSpan.textContent = `Edited: ${formattedDate}`;
    }
}

function initModals() {
    document.querySelectorAll(".close-modal").forEach((btn) => {
        btn.addEventListener("click", closeAllModals);
    });

    const modalBackdrop = document.getElementById("modal-backdrop");
    if (modalBackdrop) {
        modalBackdrop.addEventListener("click", closeAllModals);
    }

    setupColorPicker(".edit-color-options");

    const saveEditBtn = document.getElementById("save-edit");
    if (saveEditBtn) {
        saveEditBtn.addEventListener("click", saveNoteEdit);
    }

    const cancelDeleteBtn = document.querySelector(".cancel-delete");
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener("click", closeAllModals);
    }

    const confirmDeleteBtn = document.querySelector(".confirm-delete");
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", confirmDeleteNote);
    }

    const editTextarea = document.getElementById("edit-body");
    if (editTextarea) {
        editTextarea.addEventListener("input", () => {
            editTextarea.style.height = "auto";
            editTextarea.style.height =
                Math.min(300, editTextarea.scrollHeight) + "px";

            updateTaskPreview(editTextarea.value);
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeAllModals();
        } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            const editModal = document.getElementById("edit-modal");
            if (editModal && editModal.classList.contains("active")) {
                e.preventDefault();
                saveNoteEdit();
            }
        }
    });

    if (editTextarea) {
        editTextarea.addEventListener("input", () => {
            updateTaskPreview(editTextarea.value);
        });
    }

    const addCheckboxBtn = document.getElementById("add-checkbox-btn");
    if (addCheckboxBtn && editTextarea) {
        addCheckboxBtn.addEventListener("click", () => {
            insertTaskTemplate(editTextarea);
        });
    }
}

function updateTaskPreview(content) {
    let taskPreview = document.getElementById("task-preview");
    if (!taskPreview) {
        taskPreview = document.createElement("div");
        taskPreview.id = "task-preview";

        const title = document.createElement("div");
        title.id = "task-preview-title";
        title.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Task Preview (click to toggle)`;

        taskPreview.appendChild(title);

        const formActions = document.querySelector("#edit-modal .form-actions");
        formActions.parentNode.insertBefore(taskPreview, formActions);
    }

    const tasks = [];
    const regex = /- \[([ x])\] (.+)(?:\r\n|\r|\n|$)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        tasks.push({
            completed: match[1] === "x",
            text: match[2].trim(),
            original: match[0],
        });
    }

    const title = taskPreview.querySelector("#task-preview-title");
    taskPreview.innerHTML = "";
    taskPreview.appendChild(title);

    if (tasks.length === 0) {
        taskPreview.style.display = "none";
        return;
    }

    taskPreview.style.display = "block";

    tasks.forEach((task, index) => {
        const taskItem = document.createElement("div");
        taskItem.className = "task-item";
        taskItem.dataset.index = index;

        const label = document.createElement("label");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = task.completed;

        checkbox.addEventListener("change", (e) => {
            e.stopPropagation();

            const editBody = document.getElementById("edit-body");
            const newContent = editBody.value.replace(
                task.original,
                task.original.replace(
                    `[${task.completed ? "x" : " "}]`,
                    `[${e.target.checked ? "x" : " "}]`
                )
            );

            editBody.value = newContent;

            updateTaskPreview(newContent);
        });

        const taskText = document.createElement("span");
        taskText.className = "task-text" + (task.completed ? " completed" : "");
        taskText.textContent = task.text;

        label.appendChild(checkbox);
        label.appendChild(taskText);
        taskItem.appendChild(label);

        taskText.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            checkbox.checked = !checkbox.checked;

            const changeEvent = new Event("change");
            checkbox.dispatchEvent(changeEvent);
        });

        taskPreview.appendChild(taskItem);
    });

    setTimeout(() => {
        if (taskPreview.scrollHeight > taskPreview.clientHeight) {
            taskPreview.classList.add("scrollable");

            taskPreview.style.overflow = "overlay";

            taskPreview.addEventListener("scroll", function () {
                if (
                    this.scrollHeight - this.scrollTop - this.clientHeight <
                    20
                ) {
                    this.classList.remove("scrollable");
                } else {
                    this.classList.add("scrollable");
                }
            });
        } else {
            taskPreview.classList.remove("scrollable");
        }
    }, 0);
}

function updateMainFormTaskPreview(content) {
    let taskPreview = document.getElementById("main-task-preview");
    if (!taskPreview) {
        taskPreview = document.createElement("div");
        taskPreview.id = "main-task-preview";
        taskPreview.style.cssText =
            "margin-top: var(--spacing-sm); border-top: 1px dashed var(--border); padding-top: var(--spacing-sm);";

        const title = document.createElement("div");
        title.id = "main-task-preview-title";
        title.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Task Preview`;
        title.style.cssText =
            "font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--spacing-xs); font-weight: 500; display: flex; align-items: center;";
        title.querySelector("svg").style.cssText =
            "margin-right: 6px; stroke-width: 2px; width: 16px; height: 16px;";

        taskPreview.appendChild(title);

        const formActions = document.querySelector("#note-form .form-actions");
        formActions.parentNode.insertBefore(taskPreview, formActions);
    }

    const tasks = [];
    const regex = /- \[([ x])\] (.+)(?:\r\n|\r|\n|$)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        tasks.push({
            completed: match[1] === "x",
            text: match[2].trim(),
            original: match[0],
        });
    }

    const title = taskPreview.querySelector("#main-task-preview-title");
    taskPreview.innerHTML = "";
    taskPreview.appendChild(title);

    if (tasks.length === 0) {
        taskPreview.style.display = "none";
        return;
    }

    taskPreview.style.display = "block";

    tasks.forEach((task, index) => {
        const taskItem = document.createElement("div");
        taskItem.className = "task-item";
        taskItem.dataset.index = index;
        taskItem.style.marginLeft = "var(--spacing-sm)";

        const label = document.createElement("label");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = task.completed;

        checkbox.addEventListener("change", (e) => {
            e.stopPropagation();

            const mainBody = document.getElementById("note-body");
            const newContent = mainBody.value.replace(
                task.original,
                task.original.replace(
                    `[${task.completed ? "x" : " "}]`,
                    `[${e.target.checked ? "x" : " "}]`
                )
            );

            mainBody.value = newContent;
            updateMainFormTaskPreview(newContent);
        });

        const taskText = document.createElement("span");
        taskText.className = "task-text" + (task.completed ? " completed" : "");
        taskText.textContent = task.text;

        label.appendChild(checkbox);
        label.appendChild(taskText);
        taskItem.appendChild(label);

        taskText.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            checkbox.checked = !checkbox.checked;

            const changeEvent = new Event("change");
            checkbox.dispatchEvent(changeEvent);
        });

        taskPreview.appendChild(taskItem);
    });

    setTimeout(() => {
        if (taskPreview.scrollHeight > taskPreview.clientHeight) {
            taskPreview.classList.add("scrollable");

            taskPreview.addEventListener("scroll", function () {
                if (
                    this.scrollHeight - this.scrollTop - this.clientHeight <
                    20
                ) {
                    this.classList.remove("scrollable");
                } else {
                    this.classList.add("scrollable");
                }
            });
        } else {
            taskPreview.classList.remove("scrollable");
        }
    }, 0);
}

function openEditModal(noteId) {
    const note = getNoteById(noteId);
    if (!note) return;

    document.getElementById("edit-title").value = note.title || "";

    const editBody = document.getElementById("edit-body");
    editBody.value = note.body || "";

    document.getElementById("edit-note-id").value = noteId;

    document
        .querySelectorAll(".edit-color-options .color-option")
        .forEach((opt) => {
            opt.classList.remove("selected");
            if (opt.dataset.color === note.color) {
                opt.classList.add("selected");
            }
        });

    const modal = document.getElementById("edit-modal");
    const backdrop = document.getElementById("modal-backdrop");

    backdrop.style.display = "block";
    setTimeout(() => {
        backdrop.classList.add("active");

        modal.style.display = "block";
        setTimeout(() => {
            modal.classList.add("active");

            setTimeout(() => {
                editBody.style.height = "auto";
                editBody.style.height =
                    Math.min(300, editBody.scrollHeight) + "px";

                updateTaskPreview(editBody.value);

                const titleInput = document.getElementById("edit-title");
                titleInput.focus();
                titleInput.setSelectionRange(
                    titleInput.value.length,
                    titleInput.value.length
                );

                const addCheckboxBtn =
                    document.getElementById("add-checkbox-btn");
                if (addCheckboxBtn) {
                    addCheckboxBtn.onclick = () => {
                        insertTaskTemplate(editBody);
                        return false;
                    };
                }
            }, 300);
        }, 30);
    }, 10);

    setTimeout(() => {
        let markdownHint = document.querySelector(".markdown-hint");
        if (!markdownHint) {
            markdownHint = document.createElement("div");
            markdownHint.className = "markdown-hint";
            markdownHint.innerHTML = "<i>Markdown formatting supported</i>";
            markdownHint.style.fontSize = "0.8rem";
            markdownHint.style.opacity = "0.7";
            markdownHint.style.marginTop = "-0.5rem";
            markdownHint.style.marginBottom = "0.5rem";
            const modalBody = document.querySelector("#edit-modal .modal-body");
            modalBody.insertBefore(
                markdownHint,
                document.getElementById("edit-body")
            );
        }
    }, 300);
}

function closeAllModals() {
    const taskPreview = document.getElementById("task-preview");
    if (taskPreview) {
        taskPreview.remove();
    }

    const modals = document.querySelectorAll(".modal");
    const backdrop = document.getElementById("modal-backdrop");

    modals.forEach((modal) => {
        modal.classList.remove("active");
    });
    backdrop.classList.remove("active");

    setTimeout(() => {
        modals.forEach((modal) => {
            modal.style.display = "none";
        });
        backdrop.style.display = "none";
    }, 300);
}

function saveNoteEdit() {
    const noteId = document.getElementById("edit-note-id").value;
    const title = document.getElementById("edit-title").value.trim();
    const body = document.getElementById("edit-body").value.trim();

    if (!title && !body) {
        showModalError("Please add a title or note content before saving");
        return;
    }

    const selectedColorOption = document.querySelector(
        ".edit-color-options .color-option.selected"
    );
    const color = selectedColorOption
        ? selectedColorOption.dataset.color
        : "white";

    let notes = JSON.parse(localStorage.getItem("notes") || "[]");
    const noteIndex = notes.findIndex((n) => n.id === noteId);

    if (noteIndex !== -1) {
        const tasks = extractTasks(body);

        notes[noteIndex].title = title;
        notes[noteIndex].body = body;
        notes[noteIndex].color = color;
        notes[noteIndex].lastEdited = new Date();
        notes[noteIndex].tasks = tasks;

        localStorage.setItem("notes", JSON.stringify(notes));

        updateNoteInDOM(notes[noteIndex]);

        const saveButton = document.getElementById("save-edit");
        saveButton.textContent = "Saved!";
        saveButton.style.backgroundColor = "#34A853";
        saveButton.style.transform = "scale(1.05)";

        setTimeout(() => {
            saveButton.style.transform = "";
            closeAllModals();

            setTimeout(() => {
                saveButton.textContent = "Save";
                saveButton.style.backgroundColor = "";
            }, 300);
        }, 700);
    }
}

function showModalError(message) {
    let errorToast = document.getElementById("modal-error-toast");

    if (!errorToast) {
        errorToast = document.createElement("div");
        errorToast.id = "modal-error-toast";
        errorToast.style.position = "absolute";
        errorToast.style.bottom = "20px";
        errorToast.style.left = "50%";
        errorToast.style.transform = "translateX(-50%) translateY(20px)";
        errorToast.style.backgroundColor = "#EA4335";
        errorToast.style.color = "white";
        errorToast.style.padding = "10px 20px";
        errorToast.style.borderRadius = "4px";
        errorToast.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
        errorToast.style.zIndex = "1100";
        errorToast.style.opacity = "0";
        errorToast.style.transition = "all 0.3s ease";

        document.body.appendChild(errorToast);
    }

    errorToast.textContent = message;
    errorToast.style.opacity = "1";
    errorToast.style.transform = "translateX(-50%) translateY(0)";

    const titleInput = document.getElementById("edit-title");
    const bodyInput = document.getElementById("edit-body");

    if (!titleInput.value.trim() && !bodyInput.value.trim()) {
        titleInput.style.borderColor = "#EA4335";
        bodyInput.style.borderColor = "#EA4335";
    }

    setTimeout(() => {
        errorToast.style.opacity = "0";
        errorToast.style.transform = "translateX(-50%) translateY(20px)";

        titleInput.style.borderColor = "";
        bodyInput.style.borderColor = "";

        setTimeout(() => {
            if (errorToast.parentNode) {
                errorToast.parentNode.removeChild(errorToast);
            }
        }, 300);
    }, 3000);
}

function confirmDeleteNote() {
    const noteId = document.getElementById("delete-note-id").value;

    const confirmButton = document.querySelector(".confirm-delete");
    confirmButton.textContent = "Deleting...";
    confirmButton.style.backgroundColor = "#c62828";
    confirmButton.style.transform = "scale(0.95)";

    setTimeout(() => {
        deleteNote(noteId);
        closeAllModals();

        setTimeout(() => {
            confirmButton.textContent = "Delete";
            confirmButton.style.backgroundColor = "";
            confirmButton.style.transform = "";
        }, 300);
    }, 300);
}

function updateNoteInDOM(note) {
    const noteCard = document.querySelector(`.note-card[data-id="${note.id}"]`);
    if (!noteCard) return;

    const noteContent = noteCard.querySelector(".note-content");
    if (!noteContent) return;
    const titleElement = noteCard.querySelector("h3");

    if (note.title) {
        if (titleElement) {
            titleElement.textContent = note.title;
        } else {
            const newTitle = document.createElement("h3");
            newTitle.textContent = note.title;
            if (noteContent) {
                noteContent.prepend(newTitle);
            }
        }
    } else if (titleElement && titleElement.parentNode) {
        titleElement.parentNode.removeChild(titleElement);
    }

    const oldBodyContent = noteCard.querySelector(".note-body");
    if (oldBodyContent && noteContent) {
        const newBodyContent = processNoteContent(note);
        noteContent.replaceChild(newBodyContent, oldBodyContent);

        if (window.noteMasonry) {
            setTimeout(() => {
                window.noteMasonry.refresh();
            }, 50);
        }
    }

    noteCard.className = `note-card note-${note.color}`;

    noteCard.style.opacity = "1";
    noteCard.style.transform = "translateY(0)";
    noteCard.style.height = "auto";
    if (window.noteMasonry) {
        setTimeout(() => window.noteMasonry.refresh(), 100);
    }
}

function getNoteById(id) {
    const notes = JSON.parse(localStorage.getItem("notes") || "[]");
    return notes.find((note) => note.id === id);
}

function openDeleteModal(noteId) {
    document.getElementById("delete-note-id").value = noteId;
    const modal = document.getElementById("delete-modal");
    const backdrop = document.getElementById("modal-backdrop");
    backdrop.style.display = "block";
    setTimeout(() => {
        backdrop.classList.add("active");
        modal.style.display = "block";
        setTimeout(() => {
            modal.classList.add("active");
        }, 30);
    }, 10);
}

function ensureMasonryLayout() {
    if (!window.noteMasonry) {
        console.log("Initializing masonry...");
        const computedStyle = getComputedStyle(document.documentElement);
        const spacingMd =
            parseFloat(
                computedStyle.getPropertyValue("--spacing-md") || "1rem"
            ) * 16;

        window.noteMasonry = new NoteMasonry("#notes-list", {
            minColumnWidth: window.innerWidth < 640 ? 160 : 220,
            maxColumns: 4,
            gutter: spacingMd,
            animated: true,
        });
    } else {
        window.noteMasonry.refresh();
    }
}
