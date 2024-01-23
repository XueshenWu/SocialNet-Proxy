"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var connection_util_1 = require("./connection.util");
var AbstractServerScheduler = /** @class */ (function () {
    function AbstractServerScheduler() {
    }
    return AbstractServerScheduler;
}());
var LinearScheduler = /** @class */ (function (_super) {
    __extends(LinearScheduler, _super);
    function LinearScheduler(serverGroup) {
        var _this = _super.call(this) || this;
        _this.serverGroup = serverGroup;
        _this.alive_servers = [];
        _this.index = 0;
        _this.updateAlive();
        _this.timeoutHandler = _this.serverGroup.timeout ? setTimeout(function () {
            _this.updateAlive();
        }, Math.max(_this.serverGroup.timeout, 60 * 3) * 1000) : undefined;
        return _this;
    }
    LinearScheduler.prototype.updateAlive = function () {
        return __awaiter(this, void 0, void 0, function () {
            var i, server;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        clearTimeout(this.timeoutHandler);
                        this.alive_servers = [];
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < this.serverGroup.servers.length)) return [3 /*break*/, 4];
                        server = this.serverGroup.servers[i];
                        return [4 /*yield*/, (0, connection_util_1.test_connection)(server.server)];
                    case 2:
                        if (_a.sent()) {
                            this.alive_servers.push(server);
                        }
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4:
                        if (this.alive_servers.length === 0) {
                            this.timeoutHandler = setTimeout(function () {
                                _this.updateAlive();
                            }, 10 * 1000);
                        }
                        else {
                            this.timeoutHandler = this.serverGroup.timeout ? setTimeout(function () {
                                _this.updateAlive();
                            }, Math.max(this.serverGroup.timeout, 60 * 3) * 1000) : undefined;
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    LinearScheduler.prototype.add = function (server) {
        this.serverGroup.servers.push(server);
        this.updateAlive();
    };
    LinearScheduler.prototype.remove = function (server) {
        var index = this.serverGroup.servers.findIndex(function (s) { return s.id === server.id; });
        if (index !== -1) {
            this.serverGroup.servers.splice(index, 1);
        }
        this.updateAlive();
    };
    LinearScheduler.prototype.forEach = function (fn) {
        this.alive_servers.forEach(fn);
    };
    return LinearScheduler;
}(AbstractServerScheduler));
var RoundRobinScheduler = /** @class */ (function (_super) {
    __extends(RoundRobinScheduler, _super);
    function RoundRobinScheduler(serverGroup) {
        return _super.call(this, serverGroup) || this;
    }
    RoundRobinScheduler.prototype.next = function () {
        if (this.alive_servers.length === 0) {
            throw new Error("No server available");
        }
        else {
            this.index = (this.index + 1) % this.alive_servers.length;
            return this.alive_servers[this.index];
        }
    };
    return RoundRobinScheduler;
}(LinearScheduler));
var WeightedRandomScheduler = /** @class */ (function (_super) {
    __extends(WeightedRandomScheduler, _super);
    function WeightedRandomScheduler(serverGroup) {
        var _this = _super.call(this, serverGroup) || this;
        _this.totalWeight = 0;
        _this.totalWeight = 0;
        _this.updateAlive();
        return _this;
    }
    WeightedRandomScheduler.prototype.updateAlive = function () {
        return __awaiter(this, void 0, void 0, function () {
            var i, server;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        clearTimeout(this.timeoutHandler);
                        this.alive_servers = [];
                        this.totalWeight = 0;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < this.serverGroup.servers.length)) return [3 /*break*/, 4];
                        server = this.serverGroup.servers[i];
                        return [4 /*yield*/, (0, connection_util_1.test_connection)(server.server)];
                    case 2:
                        if (_a.sent()) {
                            this.alive_servers.push(server);
                            this.totalWeight += server.getWeight();
                        }
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4:
                        if (this.alive_servers.length === 0) {
                            this.timeoutHandler = setTimeout(function () {
                                _this.updateAlive();
                            }, 10 * 1000);
                        }
                        else {
                            this.timeoutHandler = this.serverGroup.timeout ? setTimeout(function () {
                                _this.updateAlive();
                            }, Math.max(this.serverGroup.timeout, 60 * 3) * 1000) : undefined;
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    WeightedRandomScheduler.prototype.next = function () {
        if (this.alive_servers.length === 0) {
            throw new Error("No server available");
        }
        else {
            var rand = Math.random() * this.totalWeight;
            var sum = 0;
            for (var i = 0; i < this.alive_servers.length; i++) {
                sum += this.alive_servers[i].getWeight();
                if (rand < sum) {
                    return this.alive_servers[i];
                }
            }
            return this.alive_servers[this.alive_servers.length - 1];
        }
    };
    return WeightedRandomScheduler;
}(LinearScheduler));
var ServerHeap = /** @class */ (function () {
    function ServerHeap(servers) {
        this.heap = Array();
        if (servers.length === 0) {
            throw new Error("No server available");
        }
        else {
            this._size = servers.length;
            this.heap = servers;
            this.buildHeap();
        }
    }
    ServerHeap.prototype.size = function () {
        return this._size;
    };
    ServerHeap.prototype.buildHeap = function () {
        for (var i = Math.floor(this._size / 2); i >= 0; i--) {
            this.heapfy_down(i);
        }
    };
    ServerHeap.prototype.add = function (server) {
        this._size++;
        this.heap.push(server);
        this.heapify_up(this._size - 1);
    };
    ServerHeap.prototype.remove = function (server) {
        var index = this.heap.findIndex(function (s) { return s.id === server.id; });
        if (index !== -1) {
            this.heap[index] = this.heap[this._size - 1];
            this._size--;
            this.heapify_up(index);
            this.heapfy_down(index);
        }
    };
    ServerHeap.prototype.pop = function () {
        if (this._size === 0) {
            throw new Error("No server available");
        }
        var server = this.heap[0];
        this.heap[0] = this.heap[this._size - 1];
        this._size--;
        this.heapfy_down(0);
        return server;
    };
    ServerHeap.prototype.heapify_up = function (index) {
        if (index === 0) {
            return;
        }
        var parent = Math.floor((index - 1) / 2);
        if (this.heap[parent].getWeight() < this.heap[index].getWeight()) {
            var temp = this.heap[parent];
            this.heap[parent] = this.heap[index];
            this.heap[index] = temp;
            this.heapify_up(parent);
        }
    };
    ServerHeap.prototype.heapfy_down = function (index) {
        var left = index * 2 + 1;
        var right = index * 2 + 2;
        if (left >= this._size) {
            return;
        }
        if (right >= this._size) {
            if (this.heap[left].getWeight() > this.heap[index].getWeight()) {
                var temp = this.heap[left];
                this.heap[left] = this.heap[index];
                this.heap[index] = temp;
                this.heapfy_down(left);
            }
        }
        else {
            if (this.heap[left].getWeight() > this.heap[right].getWeight()) {
                if (this.heap[left].getWeight() > this.heap[index].getWeight()) {
                    var temp = this.heap[left];
                    this.heap[left] = this.heap[index];
                    this.heap[index] = temp;
                    this.heapfy_down(left);
                }
            }
            else {
                if (this.heap[right].getWeight() > this.heap[index].getWeight()) {
                    var temp = this.heap[right];
                    this.heap[right] = this.heap[index];
                    this.heap[index] = temp;
                    this.heapfy_down(right);
                }
            }
        }
    };
    return ServerHeap;
}());
var MinHeapScheduler = /** @class */ (function (_super) {
    __extends(MinHeapScheduler, _super);
    function MinHeapScheduler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MinHeapScheduler.prototype.buildHeap = function (serverGroup) {
    };
    return MinHeapScheduler;
}(AbstractServerScheduler));
var servers = [];
var _loop_1 = function (i) {
    var weight = Math.floor(Math.random() * 1000);
    servers.push({ server: "http://localhost:8000", getWeight: function () { return -weight; }, id: Symbol() });
};
for (var i = 0; i < 100; i++) {
    _loop_1(i);
}
var serverHeap = new ServerHeap(servers);
while (serverHeap.size() > 0) {
    var server = serverHeap.pop();
    console.log(server.getWeight());
}
