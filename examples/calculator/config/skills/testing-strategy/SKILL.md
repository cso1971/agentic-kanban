# Testing Strategy — Distributed Playground

> Domain knowledge about testing approaches, patterns, and conventions for the distributed-playground .NET 9 microservices codebase.
> Use this skill to ground test strategy analysis in concrete frameworks, patterns, and risk areas.

---

## Test Pyramid

```
         ╱ E2E ╲              Few: critical cross-context workflows
        ╱────────╲
       ╱Integration╲          Moderate: API endpoints, consumers, DB operations
      ╱──────────────╲
     ╱   Unit Tests    ╲      Many: domain logic, entity behavior, value objects
    ╱════════════════════╲
```

### Recommended Distribution

| Level | Scope | Speed | Quantity | Framework |
|-------|-------|-------|----------|-----------|
| **Unit** | Domain entities, value objects, business rules, state transitions | < 10ms each | Many (70-80%) | xUnit |
| **Integration** | API endpoints, EF DbContext, MassTransit consumers | < 500ms each | Moderate (15-25%) | xUnit + WebApplicationFactory / MassTransit Test Harness |
| **E2E** | Cross-context event flows, full workflows | Seconds | Few (5-10%) | xUnit + TestContainers or Docker Compose |

---

## Unit Testing Patterns

### What to Unit Test

- **Entity state transitions**: verify that `Order.Ship()` changes status from `InProgress` to `Shipped`, sets `ShippedAt`, and rejects invalid transitions
- **Value object validation**: `ShippingAddress` requires non-empty fields, `PostalAddress` validates country codes
- **Computed properties**: `OrderLine.LineTotal`, `Order.GrandTotal` calculate correctly with edge values
- **Domain rules**: only delivered orders can be invoiced, cancelled orders cannot transition further, soft-delete semantics

### Unit Test Structure

```csharp
public class OrderTests
{
    [Fact]
    public void Ship_WhenInProgress_SetsShippedStatus()
    {
        // Arrange
        var order = CreateTestOrder(OrderStatus.InProgress);

        // Act
        order.Ship(trackingNumber: "TRK-123", carrier: "DHL",
                   estimatedDelivery: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)));

        // Assert
        Assert.Equal(OrderStatus.Shipped, order.Status);
        Assert.NotNull(order.ShippedAt);
        Assert.Equal("TRK-123", order.TrackingNumber);
    }

    [Fact]
    public void Ship_WhenCreated_ThrowsInvalidOperation()
    {
        var order = CreateTestOrder(OrderStatus.Created);
        Assert.Throws<InvalidOperationException>(() =>
            order.Ship("TRK-123", "DHL", DateOnly.FromDateTime(DateTime.UtcNow)));
    }
}
```

### Conventions

- One test class per domain entity: `OrderTests`, `CustomerTests`, `InvoiceTests`
- Test project naming: `{Context}.Api.Tests` (e.g., `Ordering.Api.Tests`)
- Arrange / Act / Assert structure
- Descriptive method names: `{Method}_{Scenario}_{ExpectedResult}`
- Use `[Fact]` for single cases, `[Theory]` + `[InlineData]` for parameterized tests
- Helper method `CreateTestOrder(status)` to build entities in a specific state

---

## Integration Testing Patterns

### API Endpoint Tests (WebApplicationFactory)

Test HTTP endpoints with an in-process test server:

```csharp
public class OrderEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public OrderEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace DbContext with in-memory or SQLite
                services.RemoveAll(typeof(DbContextOptions<OrderingDbContext>));
                services.AddDbContext<OrderingDbContext>(options =>
                    options.UseInMemoryDatabase("TestDb"));

                // Replace MassTransit with test harness
                services.AddMassTransitTestHarness();
            });
        }).CreateClient();
    }

    [Fact]
    public async Task GetOrders_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/orders");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
```

### Database / DbContext Tests

Test EF Core configurations, queries, and constraints:

```csharp
public class OrderingDbContextTests
{
    [Fact]
    public async Task SaveOrder_PersistsOrderAndLines()
    {
        var options = new DbContextOptionsBuilder<OrderingDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using var context = new OrderingDbContext(options);
        var order = CreateTestOrder();
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var saved = await context.Orders.Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == order.Id);

        Assert.NotNull(saved);
        Assert.Equal(order.Lines.Count, saved.Lines.Count);
    }
}
```

For schema-level tests (constraints, indexes), prefer SQLite or a real PostgreSQL TestContainer over InMemory.

### MassTransit Consumer Tests

Use the MassTransit Test Harness to test consumers in isolation:

```csharp
public class CreateOrderConsumerTests
{
    [Fact]
    public async Task Consume_ValidCommand_CreatesOrderAndPublishesEvent()
    {
        await using var provider = new ServiceCollection()
            .AddDbContext<OrderingDbContext>(o => o.UseInMemoryDatabase("test"))
            .AddMassTransitTestHarness(cfg =>
            {
                cfg.AddConsumer<CreateOrderConsumer>();
            })
            .BuildServiceProvider(true);

        var harness = provider.GetRequiredService<ITestHarness>();
        await harness.Start();

        // Send command
        await harness.Bus.Publish(new CreateOrder { /* ... */ });

        // Verify consumer consumed the message
        Assert.True(await harness.Consumed.Any<CreateOrder>());

        // Verify event was published
        Assert.True(await harness.Published.Any<OrderCreated>());
    }
}
```

---

## Edge Case Checklist

Use this checklist when evaluating proposals and acceptance criteria for completeness.

### Boundary Values

- [ ] Zero quantity, zero price, zero amount
- [ ] Maximum values (very large order with many lines, very high amounts)
- [ ] Empty collections (order with no lines, customer with no addresses)
- [ ] Minimum-length strings (single character names)
- [ ] Date boundaries (past dates, far-future dates, today)

### Null / Empty / Missing

- [ ] Null optional fields (CustomerReference, Notes, ShippingAddress)
- [ ] Empty strings where strings are required
- [ ] Missing required fields in commands/DTOs
- [ ] Guid.Empty as an ID

### State Transitions

- [ ] Every valid transition is tested (Created→InProgress, InProgress→Shipped, etc.)
- [ ] Every invalid transition is rejected (Created→Shipped, Invoiced→Cancelled, etc.)
- [ ] Transitions from terminal states fail (Cancelled→anything, Completed→anything)
- [ ] Double transitions (invoicing an already-invoiced order)
- [ ] Cancellation from each non-terminal state

### Concurrency

- [ ] Two requests try to advance the same order simultaneously (optimistic concurrency)
- [ ] Two consumers process the same event (idempotency)
- [ ] Race between order creation and customer deletion
- [ ] Simultaneous invoice generation for the same order

### MassTransit / Event-Driven

- [ ] **Idempotency**: consumer processes the same message twice — result is the same
- [ ] **Out-of-order events**: `OrderDelivered` arrives before `OrderShipped` is processed
- [ ] **Missing references**: invoice references an order that doesn't exist yet in the invoicing schema
- [ ] **Poison messages**: malformed command/event goes to error queue — doesn't crash the consumer
- [ ] **Partial failures**: entity saved to DB but event publication fails (or vice versa)

### Cross-Context Consistency

- [ ] Customer referenced by an order gets cancelled — what happens to existing orders?
- [ ] Order is cancelled after an invoice has been generated
- [ ] Event propagation delay: query returns stale data between event publish and consumer processing

### Data Integrity

- [ ] Unique constraints (no duplicate invoices for the same order)
- [ ] Referential integrity within schema (OrderLine.OrderId must exist)
- [ ] Schema isolation (no accidental cross-schema queries)
- [ ] Decimal precision (currency calculations, tax rounding)

---

## Test Infrastructure Patterns

### In-Memory Database

Fast but limited — no schema constraints, no migrations, no PostgreSQL-specific features:

```csharp
services.AddDbContext<XxxDbContext>(options =>
    options.UseInMemoryDatabase(Guid.NewGuid().ToString()));
```

Use for: unit-like tests of repository logic, basic CRUD.

### SQLite In-Memory

Better fidelity than InMemory provider — supports constraints and basic SQL:

```csharp
var connection = new SqliteConnection("DataSource=:memory:");
connection.Open();
services.AddDbContext<XxxDbContext>(options => options.UseSqlite(connection));
```

Use for: testing constraints, migrations (with caveats), query behavior.

### TestContainers (PostgreSQL)

Full PostgreSQL in Docker — highest fidelity:

```csharp
var postgres = new PostgreSqlBuilder()
    .WithImage("postgres:16")
    .Build();
await postgres.StartAsync();

services.AddDbContext<XxxDbContext>(options =>
    options.UseNpgsql(postgres.GetConnectionString()));
```

Use for: schema creation, migration testing, PostgreSQL-specific features.

### MassTransit Test Harness

In-memory message bus — no RabbitMQ needed:

```csharp
services.AddMassTransitTestHarness(cfg =>
{
    cfg.AddConsumer<MyConsumer>();
});
```

Provides `ITestHarness` with `Consumed`, `Published`, `Sent` collections for assertions.

### Test Fixtures and Builders

Use builder/factory patterns for test data:

```csharp
public static class TestOrderBuilder
{
    public static Order Create(
        OrderStatus status = OrderStatus.Created,
        Guid? customerId = null,
        int lineCount = 1)
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId ?? Guid.NewGuid(),
            Status = status,
            CreatedAt = DateTime.UtcNow
        };
        // add lines, set state-specific properties...
        return order;
    }
}
```

---

## Acceptance Criteria Testability Rules

When evaluating acceptance criteria, apply these rules:

### A Good Criterion

- Has a **clear trigger**: "When an order is delivered..."
- Has a **specific outcome**: "...an invoice is generated with the order's total amount"
- Has a **verifiable condition**: the tester knows exactly what to check
- Uses **Given/When/Then** format when the scenario has preconditions

### Given/When/Then Format

```
Given an order in "Delivered" status with grand total EUR 150.00
When the GenerateInvoice command is processed
Then an Invoice entity is created with:
  - OrderId = the delivered order's ID
  - CustomerId = the order's CustomerId
  - TotalAmount = EUR 150.00
  - Status = "Draft"
And an InvoiceGenerated event is published with matching InvoiceId and Amount
```

### Red Flags (Vague Criteria)

| Bad criterion | Problem | Better version |
|---------------|---------|----------------|
| "The system should handle errors" | Which errors? What happens? | "When GenerateInvoice references a non-existent OrderId, the consumer logs a warning and moves the message to the error queue" |
| "Invoices should be correct" | What does "correct" mean? | "Invoice TotalAmount equals the Order GrandTotal at the time of delivery" |
| "Performance should be acceptable" | No measurable threshold | "Invoice generation completes within 500ms for orders with up to 100 lines" |
| "The API should be secure" | No specific checks | "The POST /api/invoices endpoint requires a valid JWT with 'invoicing' scope" |

---

## Risk Assessment Matrix

Use this to prioritize testing effort:

| Risk area | Likelihood | Impact | Testing priority |
|-----------|-----------|--------|-----------------|
| Domain state transitions (invalid states) | Medium | High | **Critical** — unit test every transition |
| MassTransit consumer idempotency | High | High | **Critical** — integration test with duplicates |
| Cross-context eventual consistency | Medium | High | **High** — integration test event chains |
| Concurrent operations on same entity | Low | High | **High** — test with parallel requests |
| API input validation | Medium | Medium | **Medium** — parameterized endpoint tests |
| Database schema/migration correctness | Low | High | **Medium** — verify with SQLite or TestContainers |
| YARP routing configuration | Low | Low | **Low** — smoke test new routes |
| Decimal precision in calculations | Medium | Medium | **Medium** — unit test with boundary values |
