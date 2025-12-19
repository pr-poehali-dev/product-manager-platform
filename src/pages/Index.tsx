import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Product {
  id: string;
  name: string;
  code: string;
  unit: string;
}

interface UserOrder {
  productId: string;
  quantity: number;
  userName: string;
}

const Index = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([
    { id: "1", name: "Мука пшеничная", code: "MK-001", unit: "кг" },
    { id: "2", name: "Сахар белый", code: "SG-002", unit: "кг" },
    { id: "3", name: "Молоко 3.2%", code: "ML-003", unit: "л" },
  ]);

  const [users, setUsers] = useState<string[]>([
    "Пользователь 1",
    "Пользователь 2",
    "Пользователь 3",
    "Пользователь 4",
    "Пользователь 5",
    "Пользователь 6",
    "Пользователь 7",
    "Пользователь 8",
    "Пользователь 9",
    "Пользователь 10",
    "Пользователь 11",
    "Пользователь 12",
  ]);

  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(users[0]);
  
  const [newProduct, setNewProduct] = useState({ name: "", code: "", unit: "" });
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingUserIndex, setEditingUserIndex] = useState<number | null>(null);
  const [editingUserName, setEditingUserName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addProduct = () => {
    if (!newProduct.name || !newProduct.code || !newProduct.unit) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля товара",
        variant: "destructive",
      });
      return;
    }

    const isDuplicate = products.some(p => p.code === newProduct.code);
    if (isDuplicate) {
      toast({
        title: "Ошибка",
        description: "Товар с таким кодом уже существует",
        variant: "destructive",
      });
      return;
    }

    setProducts([...products, { ...newProduct, id: Date.now().toString() }]);
    setNewProduct({ name: "", code: "", unit: "" });
    setIsAddProductOpen(false);
    toast({
      title: "Успешно",
      description: "Товар добавлен в каталог",
    });
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    setOrders(orders.filter(o => o.productId !== id));
    toast({
      title: "Успешно",
      description: "Товар удален из каталога",
    });
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        let addedCount = 0;
        let skippedCount = 0;

        jsonData.forEach((row) => {
          const name = row['Название'] || row['название'] || row['name'] || '';
          const code = row['Код'] || row['код'] || row['code'] || '';
          const unit = row['Единица'] || row['единица'] || row['unit'] || '';

          if (name && code && unit) {
            const isDuplicate = products.some(p => p.code === code);
            if (!isDuplicate) {
              setProducts(prev => [...prev, {
                id: Date.now().toString() + Math.random(),
                name: name.toString(),
                code: code.toString(),
                unit: unit.toString()
              }]);
              addedCount++;
            } else {
              skippedCount++;
            }
          }
        });

        toast({
          title: "Импорт завершен",
          description: `Добавлено: ${addedCount}, пропущено (дубликаты): ${skippedCount}`,
        });
      } catch (error) {
        toast({
          title: "Ошибка импорта",
          description: "Не удалось прочитать файл. Проверьте формат.",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addOrder = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      toast({
        title: "Ошибка",
        description: "Количество должно быть больше нуля",
        variant: "destructive",
      });
      return;
    }

    setOrders([...orders, { productId, quantity, userName: selectedUser }]);
    toast({
      title: "Успешно",
      description: "Товар добавлен в заказ",
    });
  };

  const updateUserName = (index: number) => {
    if (!editingUserName.trim()) {
      toast({
        title: "Ошибка",
        description: "Имя пользователя не может быть пустым",
        variant: "destructive",
      });
      return;
    }
    const newUsers = [...users];
    newUsers[index] = editingUserName;
    setUsers(newUsers);
    setEditingUserIndex(null);
    toast({
      title: "Успешно",
      description: "Имя пользователя обновлено",
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSummaryData = () => {
    const summary = new Map<string, { product: Product; totalQuantity: number; users: string[] }>();
    
    orders.forEach(order => {
      const product = products.find(p => p.id === order.productId);
      if (!product) return;

      if (summary.has(order.productId)) {
        const existing = summary.get(order.productId)!;
        existing.totalQuantity += order.quantity;
        if (!existing.users.includes(order.userName)) {
          existing.users.push(order.userName);
        }
      } else {
        summary.set(order.productId, {
          product,
          totalQuantity: order.quantity,
          users: [order.userName],
        });
      }
    });

    return Array.from(summary.values());
  };

  const exportToExcel = () => {
    const summaryData = getSummaryData();
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Название,Код товара,Единица измерения,Общее количество,Пользователи\n";
    
    summaryData.forEach(item => {
      csvContent += `"${item.product.name}","${item.product.code}","${item.product.unit}",${item.totalQuantity},"${item.users.join(", ")}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `заказы_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Успешно",
      description: "Таблица экспортирована",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">Система управления заказами</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="orders">
              <Icon name="ShoppingCart" className="mr-2" size={18} />
              Заказы
            </TabsTrigger>
            <TabsTrigger value="catalog">
              <Icon name="Package" className="mr-2" size={18} />
              Каталог
            </TabsTrigger>
            <TabsTrigger value="summary">
              <Icon name="FileSpreadsheet" className="mr-2" size={18} />
              Сводка
            </TabsTrigger>
            <TabsTrigger value="users">
              <Icon name="Users" className="mr-2" size={18} />
              Пользователи
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6 animate-fade-in">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label>Выберите пользователя</Label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full mt-2 px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {users.map((user, idx) => (
                      <option key={idx} value={user}>{user}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Поиск товаров</Label>
                  <div className="relative mt-2">
                    <Icon name="Search" className="absolute left-3 top-3 text-muted-foreground" size={18} />
                    <Input
                      placeholder="Название или код товара..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">Код: {product.code}</p>
                      <p className="text-sm text-muted-foreground">Единица: {product.unit}</p>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Кол-во"
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget;
                            addOrder(product.id, Number(input.value));
                            input.value = '';
                          }
                        }}
                      />
                      <Button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          addOrder(product.id, Number(input.value));
                          input.value = '';
                        }}
                        size="sm"
                      >
                        <Icon name="Plus" size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="catalog" className="animate-fade-in">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Управление каталогом</h2>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleImportExcel}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Icon name="Upload" className="mr-2" size={18} />
                    Импорт из Excel
                  </Button>
                  <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Icon name="Plus" className="mr-2" size={18} />
                        Добавить товар
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Новый товар</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>Название</Label>
                        <Input
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          placeholder="Введите название"
                        />
                      </div>
                      <div>
                        <Label>Код товара</Label>
                        <Input
                          value={newProduct.code}
                          onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                          placeholder="Введите код"
                        />
                      </div>
                      <div>
                        <Label>Единица измерения</Label>
                        <Input
                          value={newProduct.unit}
                          onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                          placeholder="кг, л, шт..."
                        />
                      </div>
                      <Button onClick={addProduct} className="w-full">
                        Добавить
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Код</TableHead>
                      <TableHead>Единица</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.code}</TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="summary" className="animate-fade-in">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Сводная таблица заказов</h2>
                <Button onClick={exportToExcel}>
                  <Icon name="Download" className="mr-2" size={18} />
                  Экспорт в Excel
                </Button>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Код</TableHead>
                      <TableHead>Единица</TableHead>
                      <TableHead>Общее количество</TableHead>
                      <TableHead>Заказали</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getSummaryData().map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.product.name}</TableCell>
                        <TableCell>{item.product.code}</TableCell>
                        <TableCell>{item.product.unit}</TableCell>
                        <TableCell className="font-bold text-primary">{item.totalQuantity}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.users.join(", ")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {getSummaryData().length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Заказов пока нет
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="animate-fade-in">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Управление пользователями</h2>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>№</TableHead>
                      <TableHead>Имя пользователя</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          {editingUserIndex === idx ? (
                            <Input
                              value={editingUserName}
                              onChange={(e) => setEditingUserName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') updateUserName(idx);
                                if (e.key === 'Escape') setEditingUserIndex(null);
                              }}
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium">{user}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingUserIndex === idx ? (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" onClick={() => updateUserName(idx)}>
                                <Icon name="Check" size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingUserIndex(null)}
                              >
                                <Icon name="X" size={16} />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingUserIndex(idx);
                                setEditingUserName(user);
                              }}
                            >
                              <Icon name="Pencil" size={16} />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;