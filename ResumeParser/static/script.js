document.addEventListener("DOMContentLoaded", function() {
    // -----------------------------------------
    // Global Elements and Variables
    // -----------------------------------------
    const wrapper = document.getElementById("wrapper");
    const menuToggle = document.getElementById("menu-toggle");
    const dropzone = document.getElementById("dropzone");
    const resumeFileInput = document.getElementById("resumeFileInput");
    const selectedFileSection = document.getElementById("selectedFileSection");
    const selectedFileName = document.getElementById("selectedFileName");
    const selectedFileSize = document.getElementById("selectedFileSize");
    const clearFileBtn = document.getElementById("clearFileBtn");
    const fileTypeIcon = document.getElementById("fileTypeIcon");
    const overwriteSwitch = document.getElementById("overwriteSwitch");
    const uploadSubmitBtn = document.getElementById("uploadSubmitBtn");
    const uploadForm = document.getElementById("uploadForm");
    const uploadLoader = document.getElementById("uploadLoader");
    const parseProgressBar = document.getElementById("parseProgressBar");
    const parseProgressLabel = document.getElementById("parseProgressLabel");
    const candidateSearchInput = document.getElementById("candidateSearchInput");
    const candidatesListContainer = document.getElementById("candidatesListContainer");
    const candidateCountLabel = document.getElementById("candidateCountLabel");
    const quickSkillFilters = document.getElementById("quickSkillFilters");

    // Modal elements
    const duplicateModal = new bootstrap.Modal(document.getElementById("duplicateModal"));
    const duplicateEmail = document.getElementById("duplicateEmail");
    const forceOverwriteBtn = document.getElementById("forceOverwriteBtn");
    
    const candidateDetailModal = new bootstrap.Modal(document.getElementById("candidateDetailModal"));
    const detailName = document.getElementById("detailName");
    const detailModalBody = document.getElementById("detailModalBody");
    const downloadJsonBtn = document.getElementById("downloadJsonBtn");

    let selectedFile = null;
    let cachedCandidates = [];

    // Toggle sidebar menu
    if (menuToggle) {
        menuToggle.addEventListener("click", function(e) {
            e.preventDefault();
            wrapper.classList.toggle("toggled");
        });
    }

    // -----------------------------------------
    // File Selection & Drag & Drop Handlers
    // -----------------------------------------
    if (dropzone) {
        // Trigger file input click
        dropzone.addEventListener("click", () => {
            resumeFileInput.click();
        });

        // Dragover state
        dropzone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropzone.classList.add("dragover");
        });

        // Dragleave state
        dropzone.addEventListener("dragleave", () => {
            dropzone.classList.remove("dragover");
        });

        // Drop file
        dropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropzone.classList.remove("dragover");
            
            if (e.dataTransfer.files.length > 0) {
                handleFileSelect(e.dataTransfer.files[0]);
            }
        });
    }

    if (resumeFileInput) {
        resumeFileInput.addEventListener("change", (e) => {
            if (e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
            }
        });
    }

    function handleFileSelect(file) {
        const fileExt = file.name.split('.').pop().toLowerCase();
        if (fileExt !== 'pdf' && fileExt !== 'docx') {
            alert("Unsupported format! Only PDF and DOCX documents can be parsed.");
            return;
        }

        selectedFile = file;
        selectedFileName.innerText = file.name;
        
        // Calculate readable file size
        const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
        selectedFileSize.innerText = `${sizeInMb} MB`;

        // Update file icon based on type
        if (fileExt === 'pdf') {
            fileTypeIcon.className = "fa-solid fa-file-pdf text-danger fs-4 me-3";
        } else {
            fileTypeIcon.className = "fa-solid fa-file-word text-primary fs-4 me-3";
        }

        // Visual updates
        dropzone.classList.add("d-none");
        selectedFileSection.classList.remove("d-none");
        uploadSubmitBtn.removeAttribute("disabled");
    }

    if (clearFileBtn) {
        clearFileBtn.addEventListener("click", () => {
            resetFileSelection();
        });
    }

    function resetFileSelection() {
        selectedFile = null;
        resumeFileInput.value = "";
        dropzone.classList.remove("d-none");
        selectedFileSection.classList.add("d-none");
        uploadSubmitBtn.setAttribute("disabled", "true");
    }

    // -----------------------------------------
    // Parse / Upload Operations
    // -----------------------------------------
    if (uploadForm) {
        uploadForm.addEventListener("submit", function(e) {
            e.preventDefault();
            if (!selectedFile) return;

            uploadAndParseResume(false);
        });
    }

    function uploadAndParseResume(isForcedOverwrite) {
        // Prepare Form Data
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("overwrite", isForcedOverwrite ? "true" : overwriteSwitch.checked ? "true" : "false");

        // UI progress loading states
        uploadSubmitBtn.setAttribute("disabled", "true");
        uploadLoader.classList.remove("d-none");
        
        // Staggered mock loading logs to mimic active NLP model pipeline progress
        updateProgress(15, "Reading uploaded file data stream...");
        
        setTimeout(() => updateProgress(40, "Extracting Raw Text from Document..."), 1000);
        setTimeout(() => updateProgress(65, "NLP Preprocessing: Tokenizing & Part-of-Speech Tagging..."), 2000);
        setTimeout(() => updateProgress(85, "Executing spaCy Named Entity Recognition model..."), 3500);

        fetch("/upload", {
            method: "POST",
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            // Remove loading
            uploadLoader.classList.add("d-none");
            uploadSubmitBtn.removeAttribute("disabled");

            if (data.duplicate) {
                // Trigger duplicate warnings overlay
                duplicateEmail.innerText = data.candidate.email;
                duplicateModal.show();
            } else if (data.success) {
                // Complete progress bar
                updateProgress(100, "Extraction Successful!");
                setTimeout(() => {
                    alert(data.message || "Resume extracted successfully!");
                    resetFileSelection();
                    loadCandidates(); // Refresh directories grid
                }, 400);
            } else if (data.error) {
                alert(`Error: ${data.error}`);
                resetProgress();
            }
        })
        .catch(err => {
            uploadLoader.classList.add("d-none");
            uploadSubmitBtn.removeAttribute("disabled");
            alert(`Network failure occurred. Failed to complete parsing. details: ${err}`);
            resetProgress();
        });
    }

    function updateProgress(percentage, text) {
        if (parseProgressBar && parseProgressLabel) {
            parseProgressBar.style.width = `${percentage}%`;
            parseProgressLabel.innerText = text;
        }
    }

    function resetProgress() {
        updateProgress(0, "");
    }

    // Connect Overwrite Force Button Click
    if (forceOverwriteBtn) {
        forceOverwriteBtn.addEventListener("click", () => {
            duplicateModal.hide();
            uploadAndParseResume(true);
        });
    }

    // -----------------------------------------
    // Load Directory Entries (Candidates)
    // -----------------------------------------
    function loadCandidates(searchTerm = "") {
        let url = "/candidates";
        if (searchTerm) {
            url += `?q=${encodeURIComponent(searchTerm)}`;
        }

        fetch(url)
        .then(res => res.json())
        .then(candidates => {
            cachedCandidates = candidates;
            renderCandidatesList(candidates);
        })
        .catch(err => {
            console.error("Failed to query candidates database index: ", err);
        });
    }

    function renderCandidatesList(candidates) {
        // Update counts label
        if (candidateCountLabel) {
            candidateCountLabel.innerText = `${candidates.length} Candidate${candidates.length === 1 ? '' : 's'}`;
        }

        if (!candidatesListContainer) return;
        
        if (candidates.length === 0) {
            candidatesListContainer.innerHTML = `
                <div class="text-center py-5 text-muted col-12 bg-white rounded-3 shadow-sm">
                    <i class="fa-solid fa-box-open fs-1 mb-3 text-secondary"></i>
                    <p class="fw-semibold m-0 text-dark">No records match the current query.</p>
                    <p class="text-sm">Try adjusting your filters or search keywords.</p>
                </div>
            `;
            return;
        }

        let html = "";
        candidates.forEach(c => {
            // Render 3 tags of skills maximum to prevent layout overflow
            const skillTags = c.skills.slice(0, 3).map(skill => 
                `<span class="badge bg-secondary-subtle text-secondary me-1 py-1 px-2 text-xs rounded">${skill}</span>`
            ).join("");

            const extraCount = c.skills.length > 3 ? `<span class="text-muted text-xs">+${c.skills.length - 3}</span>` : "";

            html += `
                <div class="col-12">
                    <div class="card border-0 shadow-sm rounded-3 hover-shadow cursor-pointer transition-all p-3 bg-white mb-2" onclick="viewCandidateDetails(${c.id})">
                        <div class="d-flex align-items-start gap-3">
                            <div class="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-semibold fs-5 text-uppercase" style="width: 48px; height: 48px; min-width:48px;">
                                ${c.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div class="overflow-hidden flex-grow-1">
                                <div class="d-flex justify-content-between align-items-start">
                                    <h6 class="m-0 fw-bold text-dark text-truncate">${c.name}</h6>
                                    <span class="text-muted text-xs" style="white-space: nowrap;">${new Date(c.created_at).toLocaleDateString()}</span>
                                </div>
                                <span class="d-block text-muted text-xs text-truncate mt-1"><i class="fa-solid fa-envelope me-1"></i>${c.email || 'N/A'}</span>
                                <span class="d-block text-muted text-xs text-truncate"><i class="fa-solid fa-location-dot me-1"></i>${c.address || 'Not specified'}</span>
                                
                                <div class="mt-2 d-flex align-items-center gap-1">
                                    ${skillTags}
                                    ${extraCount}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        candidatesListContainer.innerHTML = html;
    }

    // Attach search input keyup event listener
    if (candidateSearchInput) {
        candidateSearchInput.addEventListener("input", function(e) {
            loadCandidates(e.target.value.trim());
        });
    }

    // Attach quick filters tags selection
    if (quickSkillFilters) {
        const filterTags = quickSkillFilters.querySelectorAll("[data-tag]");
        filterTags.forEach(tag => {
            tag.addEventListener("click", () => {
                const keyword = tag.getAttribute("data-tag");
                if (candidateSearchInput) {
                    candidateSearchInput.value = keyword;
                    loadCandidates(keyword);
                }
            });
        });
    }

    // -----------------------------------------
    // Details Modal Controller
    // -----------------------------------------
    window.viewCandidateDetails = function(id) {
        const candidate = cachedCandidates.find(c => c.id == id);
        if (!candidate) return;

        detailName.innerText = candidate.name;
        downloadJsonBtn.setAttribute("href", `/download/${candidate.id}`);

        // Construct HTML content inside Details modal body
        let skillsHtml = candidate.skills.map(s => 
            `<span class="badge bg-primary text-white py-1 px-2 text-xs rounded-pill me-1 mb-1">${s}</span>`
        ).join("");

        if (!skillsHtml) {
            skillsHtml = "<span class='text-muted italic text-xs'>No verified skills discovered</span>";
        }

        let eduHtml = candidate.education.map(e => 
            `<li class="mb-1 text-sm text-dark"><i class="fa-solid fa-graduation-cap text-muted me-2"></i>${e}</li>`
        ).join("");

        if (!eduHtml) {
            eduHtml = "<li class='text-muted italic text-sm'>No formal academic entries detected</li>";
        }

        let expHtml = candidate.experience.map(exp => 
            `<li class="mb-2 text-sm text-dark"><i class="fa-solid fa-briefcase text-muted me-2"></i>${exp}</li>`
        ).join("");

        if (!expHtml) {
            expHtml = "<li class='text-muted italic text-sm'>No prior employment history indexed</li>";
        }

        detailModalBody.innerHTML = `
            <div class="row g-4">
                <div class="col-md-4 text-center border-end">
                    <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-2 text-uppercase mx-auto mb-3 shadow" style="width: 80px; height: 80px;">
                        ${candidate.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <h5 class="fw-bold text-dark m-0">${candidate.name}</h5>
                    <span class="badge bg-light text-dark border mt-2 text-xs px-3 py-1 rounded-pill">Parsed Candidate</span>
                    
                    <div class="text-start mt-4">
                        <span class="d-block text-muted text-xs text-uppercase tracking-wider fw-bold">Contact Info</span>
                        <p class="text-dark text-sm mb-1 mt-1"><i class="fa-solid fa-envelope text-muted me-2"></i>${candidate.email || 'N/A'}</p>
                        <p class="text-dark text-sm mb-1"><i class="fa-solid fa-phone text-muted me-2"></i>${candidate.phone || 'N/A'}</p>
                        <p class="text-dark text-sm mb-1"><i class="fa-solid fa-location-dot text-muted me-2"></i>${candidate.address || 'N/A'}</p>
                        
                        <span class="d-block text-muted text-xs text-uppercase tracking-wider fw-bold mt-4">Professional Handles</span>
                        <p class="text-dark text-sm mb-1 mt-1">
                            <i class="fa-brands fa-linkedin text-primary me-2"></i>
                            ${candidate.linkedin ? `<a href="${candidate.linkedin}" target="_blank" class="text-decoration-none">${candidate.linkedin.split('/').pop()}</a>` : 'Not Linked'}
                        </p>
                        <p class="text-dark text-sm mb-1">
                            <i class="fa-brands fa-github text-dark me-2"></i>
                            ${candidate.github ? `<a href="${candidate.github}" target="_blank" class="text-decoration-none">${candidate.github.split('/').pop()}</a>` : 'Not Linked'}
                        </p>
                    </div>
                </div>

                <div class="col-md-8">
                    <h6 class="fw-bold text-dark border-bottom pb-2 mb-3">
                        <i class="fa-solid fa-screwdriver-wrench text-primary me-2"></i>Matched Core Skills
                    </h6>
                    <div class="d-flex flex-wrap mb-4">
                        ${skillsHtml}
                    </div>

                    <h6 class="fw-bold text-dark border-bottom pb-2 mb-3">
                        <i class="fa-solid fa-user-graduate text-success me-2"></i>Education History
                    </h6>
                    <ul class="list-unstyled ps-1 mb-4">
                        ${eduHtml}
                    </ul>

                    <h6 class="fw-bold text-dark border-bottom pb-2 mb-3">
                        <i class="fa-solid fa-business-time text-info me-2"></i>Professional Experience
                    </h6>
                    <ul class="list-unstyled ps-1 mb-4">
                        ${expHtml}
                    </ul>

                    <div class="bg-light p-3 rounded-3 border d-flex justify-content-between align-items-center">
                        <div>
                            <span class="d-block text-muted text-xs">Resume Document Name</span>
                            <strong class="text-dark text-sm">${candidate.resume_file.split('/').pop() || 'resume_doc'}</strong>
                        </div>
                        <button class="btn btn-outline-danger btn-sm rounded-3 text-xs fw-semibold px-3 py-2" onclick="deleteCandidateRecord(${candidate.id})">
                            <i class="fa-solid fa-trash-can me-1"></i>Delete Candidate
                        </button>
                    </div>
                </div>
            </div>
        `;

        candidateDetailModal.show();
    };

    window.deleteCandidateRecord = function(id) {
        if (!confirm("Are you sure you want to permanently delete this candidate profile and associated resume file? This operation cannot be undone.")) {
            return;
        }

        fetch(`/candidate/${id}`, {
            method: "DELETE"
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                candidateDetailModal.hide();
                alert(data.message || "Candidate record deleted.");
                loadCandidates(); // Refresh listing
            } else {
                alert(`Error deleting record: ${data.error}`);
            }
        })
        .catch(err => {
            alert(`Failed to request record deletion from server: ${err}`);
        });
    };

    // -----------------------------------------
    // Initialize directory list
    // -----------------------------------------
    loadCandidates();
});
