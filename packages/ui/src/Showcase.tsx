import { useState } from 'react';
import {
  Bell,
  Box,
  CreditCard,
  Plus,
  Search,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Drawer,
  EmptyState,
  Input,
  Keypad,
  Modal,
  Progress,
  Select,
  Skeleton,
  SkeletonCard,
  Spinner,
  StatCard,
  Stagger,
  Switch,
  Tabs,
  Textarea,
  Tooltip,
  useDisclosure,
  useToast,
} from './index';

/**
 * Living style guide for @retail/ui. Mount it on a route to browse every
 * component, or copy snippets into your own module.
 *
 *   import { Showcase } from '@retail/ui/src/Showcase';
 *   <ToastProvider><Showcase /></ToastProvider>
 */
export function Showcase() {
  const modal = useDisclosure();
  const drawer = useDisclosure();
  const [tab, setTab] = useState('overview');
  const [amount, setAmount] = useState('');
  const [notify, setNotify] = useState(true);
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-10 max-w-5xl mx-auto">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Retail UI — design system</h1>
        <p className="text-muted-foreground text-sm">
          Animated, themeable components any module can drop in.
        </p>
      </header>

      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stagger.Item>
          <StatCard title="Revenue" value="GHS 48,210" icon={<TrendingUp size={20} />} change="+12.4% this week" trend="up" tone="success" />
        </Stagger.Item>
        <Stagger.Item>
          <StatCard title="Orders" value="1,284" icon={<ShoppingCart size={20} />} change="+3.1%" trend="up" />
        </Stagger.Item>
        <Stagger.Item>
          <StatCard title="Customers" value="842" icon={<Users size={20} />} change="-0.8%" trend="down" tone="warning" />
        </Stagger.Item>
        <Stagger.Item>
          <StatCard title="Products" value="356" icon={<Box size={20} />} tone="muted" />
        </Stagger.Item>
      </Stagger>

      <section className="space-y-3">
        <h2 className="font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
          <Button variant="glow" leftIcon={<Plus size={16} />}>New sale</Button>
          <Button loading>Saving</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Badges</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand">Brand</Badge>
          <Badge variant="success" dot>Paid</Badge>
          <Badge variant="warning" dot>Pending</Badge>
          <Badge variant="danger">Refunded</Badge>
          <Badge variant="success" dot pulse>Live</Badge>
          <Badge variant="outline">Draft</Badge>
        </div>
      </section>

      <section className="space-y-3">
        <Tabs
          value={tab}
          onChange={setTab}
          variant="pill"
          items={[
            { value: 'overview', label: 'Overview' },
            { value: 'forms', label: 'Forms' },
            { value: 'feedback', label: 'Feedback' },
          ]}
        />

        {tab === 'overview' && (
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardBody className="flex items-center gap-3">
              <Avatar name="Ama Mensah" status="online" />
              <div className="text-sm">
                <p className="font-medium">Ama Mensah</p>
                <p className="text-muted-foreground">Completed checkout · GHS 120.00</p>
              </div>
            </CardBody>
          </Card>
        )}

        {tab === 'forms' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Search" placeholder="Find a product" leftIcon={<Search size={16} />} />
            <Select
              label="Category"
              placeholder="Choose…"
              options={[
                { value: 'food', label: 'Food & Drinks' },
                { value: 'tech', label: 'Electronics' },
              ]}
            />
            <Textarea label="Note" placeholder="Order instructions" containerClassName="sm:col-span-2" />
            <Switch checked={notify} onCheckedChange={setNotify} label="Email receipts" />
          </div>
        )}

        {tab === 'feedback' && (
          <div className="space-y-4">
            <Progress value={68} />
            <Progress tone="success" value={90} />
            <Progress />
            <div className="flex items-center gap-3">
              <Spinner label="Syncing inventory" />
              <Tooltip content="Notifications">
                <Button size="icon" variant="outline"><Bell size={16} /></Button>
              </Tooltip>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SkeletonCard />
              <div className="space-y-2">
                <Skeleton shimmer className="h-4 w-2/3" />
                <Skeleton shimmer className="h-4 w-full" />
                <Skeleton shimmer className="h-4 w-1/2" />
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Overlays & POS</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={modal.onOpen}>Open modal</Button>
          <Button variant="outline" onClick={drawer.onOpen}>Open drawer</Button>
          <Button variant="secondary" onClick={() => toast({ tone: 'success', title: 'Saved', description: 'Your changes are live.' })}>
            Fire toast
          </Button>
        </div>

        <Card className="max-w-xs">
          <CardBody className="space-y-3">
            <div className="rounded-xl bg-surface-muted px-4 py-3 text-right text-2xl font-bold tabular-nums">
              {amount || '0'}
            </div>
            <Keypad value={amount} onChange={setAmount} />
          </CardBody>
        </Card>
      </section>

      <EmptyState
        icon={<CreditCard size={24} />}
        title="No transactions yet"
        description="Once you make your first sale it will show up here."
        action={<Button leftIcon={<Plus size={16} />}>New sale</Button>}
      />

      <Modal
        open={modal.open}
        onClose={modal.onClose}
        title="Confirm payment"
        description="Charge the customer for this order?"
        footer={
          <>
            <Button variant="ghost" onClick={modal.onClose}>Cancel</Button>
            <Button onClick={modal.onClose}>Charge GHS 120.00</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          The receipt will be emailed automatically once the charge succeeds.
        </p>
      </Modal>

      <Drawer open={drawer.open} onClose={drawer.onClose} title="Order details">
        <p className="text-sm text-muted-foreground">Slide-over panel content goes here.</p>
      </Drawer>
    </div>
  );
}
