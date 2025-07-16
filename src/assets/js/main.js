

document.addEventListener('DOMContentLoaded', function() {

        let currentWorkspaceFilter = '';
        let searchQuery = '';

        // Tab functionality
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                switchTab(tabName);
            });
        });

        function switchTab(tabName) {
            // Update tab buttons
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

            // Update tab content
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');

            // Refresh content based on active tab
            if (tabName === 'workspaces') {
                renderWorkspaces();
            } else if (tabName === 'documents') {
                renderDocuments();
                populateWorkspaceFilter();
            }
        }

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderDocuments();
        });

        // Workspace filter
        document.getElementById('workspaceFilter').addEventListener('change', (e) => {
            currentWorkspaceFilter = e.target.value;
            renderDocuments();
        });

        // Modal functions
        function openModal(modalId) {
            document.getElementById(modalId).classList.add('active');
            if (modalId === 'uploadModal') {
                populateUploadWorkspaces();
            }
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Render functions
        function renderRecentDocuments() {
            const container = document.getElementById('recentDocuments');
            const recentDocs = documents.slice(0, 5);

            container.innerHTML = recentDocs.map(doc => {
                const workspace = workspaces.find(w => w.id === doc.workspaceId);
                return `
                    <div class="document-item">
                        <div class="document-info">
                            <i class="fas fa-file"></i>
                            <div class="document-details">
                                <h4>${doc.name}</h4>
                                <p>${doc.size} • ${doc.uploadDate}</p>
                            </div>
                        </div>
                        <div class="document-actions">
                            <span class="badge">${doc.type}</span>
                            <div class="dropdown">
                                <button class="btn btn-ghost" onclick="toggleDropdown(event)">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <div class="dropdown-content">
                                    <a class="dropdown-item" onclick="downloadDocument('${doc.id}')">
                                        <i class="fas fa-download"></i> Download
                                    </a>
                                    <a class="dropdown-item danger" onclick="deleteDocument('${doc.id}')">
                                        <i class="fas fa-trash"></i> Delete
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderWorkspaces() {
            const container = document.getElementById('workspaceGrid');
            container.innerHTML = workspaces.map(workspace => `
                <div class="workspace-card">
                    <div class="workspace-header">
                        <div class="workspace-title">
                            <i class="fas fa-folder" style="color: #2563eb;"></i>
                            ${workspace.name}
                        </div>
                        <div class="dropdown">
                            <button class="btn btn-ghost" onclick="toggleDropdown(event)">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="dropdown-content">
                                <a class="dropdown-item">Edit</a>
                                <a class="dropdown-item danger" onclick="deleteWorkspace('${workspace.id}')">Delete</a>
                            </div>
                        </div>
                    </div>
                    <p class="text-sm text-gray-500 mb-4">${workspace.description}</p>
                    <div class="workspace-meta">
                        <span>${workspace.documentCount} documents</span>
                        <span>Created ${workspace.createdDate}</span>
                    </div>
                </div>
            `).join('');
        }

        function renderDocuments() {
            const container = document.getElementById('documentsTable');
            const filteredDocs = documents.filter(doc => {
                const matchesSearch = doc.name.toLowerCase().includes(searchQuery);
                const matchesWorkspace = currentWorkspaceFilter ? doc.workspaceId === currentWorkspaceFilter : true;
                return matchesSearch && matchesWorkspace;
            });

            container.innerHTML = filteredDocs.map(doc => {
                const workspace = workspaces.find(w => w.id === doc.workspaceId);
                return `
                    <tr>
                        <td>
                            <div class="flex items-center gap-2">
                                <i class="fas fa-file"></i>
                                <span class="font-medium">${doc.name}</span>
                            </div>
                        </td>
                        <td><span class="badge">${doc.type}</span></td>
                        <td class="text-sm text-gray-500">${doc.size}</td>
                        <td class="text-sm text-gray-500">${doc.uploadDate}</td>
                        <td class="text-sm text-gray-500">${workspace?.name || 'Unknown'}</td>
                        <td>
                            <div class="flex gap-2">
                                <button class="btn btn-ghost" onclick="downloadDocument('${doc.id}')">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button class="btn btn-ghost btn-danger" onclick="deleteDocument('${doc.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        function populateWorkspaceFilter() {
            const select = document.getElementById('workspaceFilter');
            select.innerHTML = '<option value="">All Workspaces</option>' +
                workspaces.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
        }

        function populateUploadWorkspaces() {
            const select = document.getElementById('uploadWorkspace');
            select.innerHTML = workspaces.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
        }

        // Action functions
        function createWorkspace() {
            const name = document.getElementById('workspaceName').value;
            const description = document.getElementById('workspaceDescription').value;

            if (name && description) {
                const newWorkspace = {
                    id: Date.now().toString(),
                    name,
                    description,
                    documentCount: 0,
                    createdDate: new Date().toISOString().split('T')[0]
                };

                workspaces.push(newWorkspace);
                updateStats();
                renderWorkspaces();
                closeModal('createWorkspaceModal');

                // Clear form
                document.getElementById('workspaceName').value = '';
                document.getElementById('workspaceDescription').value = '';

                alert('Workspace created successfully!');
            }
        }

        function uploadDocument() {
            const workspaceId = document.getElementById('uploadWorkspace').value;
            const fileInput = document.getElementById('uploadFile');

            if (workspaceId && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const newDocument = {
                    id: Date.now().toString(),
                    name: file.name,
                    type: file.name.split('.').pop().toUpperCase(),
                    size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
                    uploadDate: new Date().toISOString().split('T')[0],
                    workspaceId
                };

                documents.push(newDocument);

                // Update workspace document count
                const workspace = workspaces.find(w => w.id === workspaceId);
                if (workspace) {
                    workspace.documentCount++;
                }

                updateStats();
                renderRecentDocuments();
                renderDocuments();
                closeModal('uploadModal');

                // Clear form
                fileInput.value = '';

                alert('Document uploaded successfully!');
            }
        }

        function downloadDocument(docId) {
            const doc = documents.find(d => d.id === docId);
            if (doc) {
                alert(`Downloading: ${doc.name}`);
                // In a real application, you would trigger the actual download here
            }
        }

        function deleteDocument(docId) {
            if (confirm('Are you sure you want to delete this document?')) {
                const docIndex = documents.findIndex(d => d.id === docId);
                if (docIndex > -1) {
                    const doc = documents[docIndex];
                    const workspace = workspaces.find(w => w.id === doc.workspaceId);
                    if (workspace) {
                        workspace.documentCount--;
                    }

                    documents.splice(docIndex, 1);
                    updateStats();
                    renderRecentDocuments();
                    renderDocuments();
                    alert('Document deleted successfully!');
                }
            }
        }

        function deleteWorkspace(workspaceId) {
            if (confirm('Are you sure you want to delete this workspace? All documents in this workspace will also be deleted.')) {
                // Remove workspace
                const workspaceIndex = workspaces.findIndex(w => w.id === workspaceId);
                if (workspaceIndex > -1) {
                    workspaces.splice(workspaceIndex, 1);
                }

                // Remove documents in this workspace
                documents = documents.filter(d => d.workspaceId !== workspaceId);

                updateStats();
                renderWorkspaces();
                renderRecentDocuments();
                renderDocuments();
                alert('Workspace deleted successfully!');
            }
        }

        function toggleDropdown(event) {
            event.stopPropagation();
            const dropdown = event.target.closest('.dropdown');
            const content = dropdown.querySelector('.dropdown-content');

            // Close all other dropdowns
            document.querySelectorAll('.dropdown-content').forEach(d => {
                if (d !== content) d.classList.remove('active');
            });

            content.classList.toggle('active');
        }

        function updateStats() {
            document.getElementById('totalWorkspaces').textContent = workspaces.length;
            document.getElementById('totalDocuments').textContent = documents.length;
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('active'));
        });

        // Initialize the application
        function init() {
            renderRecentDocuments();
            renderWorkspaces();
            renderDocuments();
            populateWorkspaceFilter();
            updateStats();
        }

        // Start the application
        init();

        });
