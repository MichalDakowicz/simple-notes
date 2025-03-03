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
    });

    const addTaskBtn = document.getElementById("add-task-btn");
    addTaskBtn.addEventListener("click", () => {
        insertTaskTemplate(textarea);
    });

    setupColorPicker();

    initModals();
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

    if (!body) {
        showFormError();
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
    noteCard.style.opacity = "0";
    noteCard.style.transform = "translateY(20px)";

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

    noteCard.appendChild(noteContent);

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
        return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (hours < 24) {
        return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (days < 7) {
        return `${days} day${days > 1 ? "s" : ""} ago`;
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
            const textPara = document.createElement("p");
            textPara.className = "note-text";
            textPara.textContent = textContent;
            container.appendChild(textPara);
        }
    } else {
        const para = document.createElement("p");
        para.textContent = note.body;
        container.appendChild(para);
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
            notes[noteIndex].tasks[taskIndex].completed = completed;
            notes[noteIndex].lastEdited = new Date();

            localStorage.setItem("notes", JSON.stringify(notes));

            const taskText = document.querySelector(
                `.task-item[data-task-id="${taskId}"] .task-text`
            );
            if (taskText) {
                if (completed) {
                    taskText.classList.add("completed");
                } else {
                    taskText.classList.remove("completed");
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

    document
        .getElementById("modal-backdrop")
        .addEventListener("click", closeAllModals);

    setupColorPicker(".edit-color-options");

    document
        .getElementById("save-edit")
        .addEventListener("click", saveNoteEdit);

    document
        .querySelector(".cancel-delete")
        .addEventListener("click", closeAllModals);
    document
        .querySelector(".confirm-delete")
        .addEventListener("click", confirmDeleteNote);

    const editTextarea = document.getElementById("edit-body");
    editTextarea.addEventListener("input", () => {
        editTextarea.style.height = "auto";
        editTextarea.style.height =
            Math.min(300, editTextarea.scrollHeight) + "px";
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeAllModals();
        } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            const editModal = document.getElementById("edit-modal");
            if (editModal.classList.contains("active")) {
                e.preventDefault();
                saveNoteEdit();
            }
        }
    });

    const tooltip = document.getElementById("task-info-tooltip");
    const editBody = document.getElementById("edit-body");

    tooltip.addEventListener("click", () => {
        const position = editBody.selectionStart;
        const content = editBody.value;
        const before = content.substring(0, position);
        const after = content.substring(position);

        const taskTemplate = "- [ ] Task description\n";
        editBody.value = before + taskTemplate + after;

        const newPosition = position + taskTemplate.length;
        editBody.focus();
        editBody.setSelectionRange(newPosition - 1, newPosition - 1);

        editBody.style.height = "auto";
        editBody.style.height = Math.min(300, editBody.scrollHeight) + "px";

        updateTaskPreview(editBody.value);
    });

    setTimeout(() => {
        if (tooltip) {
            tooltip.style.opacity = "0.4";
        }
    }, 5000);

    editBody.addEventListener("input", () => {
        updateTaskPreview(editBody.value);
    });

    const addCheckboxBtn = document.getElementById("add-checkbox-btn");

    addCheckboxBtn.addEventListener("click", () => {
        const position = editBody.selectionStart;
        const content = editBody.value;
        const before = content.substring(0, position);
        const after = content.substring(position);

        let prefix = "";
        if (position > 0 && before.charAt(before.length - 1) !== "\n") {
            prefix = "\n";
        }

        const taskTemplate = `${prefix}- [ ] `;
        editBody.value = before + taskTemplate + after;

        const newPosition = position + taskTemplate.length;
        editBody.focus();
        editBody.setSelectionRange(newPosition, newPosition);

        editBody.style.height = "auto";
        editBody.style.height = Math.min(300, editBody.scrollHeight) + "px";

        updateTaskPreview(editBody.value);
    });

    editBody.addEventListener("input", () => {
        updateTaskPreview(editBody.value);
    });

    if (addCheckboxBtn) {
        addCheckboxBtn.addEventListener("click", () => {
            insertTaskTemplate(editBody);
        });
    } else {
        console.error("Add checkbox button not found in the modal");
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

    if (!body) return;

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

    const titleElement = noteCard.querySelector("h3");
    const noteContent = noteCard.querySelector(".note-content");

    if (note.title) {
        if (titleElement) {
            titleElement.textContent = note.title;
        } else {
            const newTitle = document.createElement("h3");
            newTitle.textContent = note.title;
            noteContent.prepend(newTitle);
        }
    } else if (titleElement) {
        titleElement.remove();
    }

    const oldBodyContent = noteCard.querySelector(".note-body");
    if (oldBodyContent) {
        const newBodyContent = processNoteContent(note);
        noteContent.replaceChild(newBodyContent, oldBodyContent);
    }

    const timestampDiv = noteCard.querySelector(".note-timestamp");
    if (timestampDiv) {
        const createdSpan = timestampDiv.querySelector("span:first-child");
        if (createdSpan) {
            createdSpan.textContent = `Created: ${formatDate(
                new Date(note.created)
            )}`;
        }

        if (note.lastEdited && note.lastEdited !== note.created) {
            let editedSpan = timestampDiv.querySelector("span:nth-child(2)");

            if (!editedSpan) {
                editedSpan = document.createElement("span");
                timestampDiv.appendChild(editedSpan);
            }

            editedSpan.textContent = `Edited: ${formatDate(
                new Date(note.lastEdited)
            )}`;
        }
    }

    noteCard.className = `note-card note-${note.color}`;

    if (window.noteMasonry) {
        window.noteMasonry.refresh();
    }
}

function getNoteById(id) {
    const notes = JSON.parse(localStorage.getItem("notes") || "[]");
    return notes.find((note) => note.id === id);
}
